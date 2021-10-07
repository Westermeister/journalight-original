"""Provides Deduper class and stdio interface."""

# TensorFlow spits out a lot of information. We only care about errors.
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import json
import random
import sys

import tensorflow_hub as hub


class Deduper:

    """Remove semantic duplicates in a text feed across different sources."""

    def __init__(self, threshold=0.7):
        """Initialize Deduper class.

        Args:
            threshold: Float between 0 and 1. The closer to 1, the more strict the standard for concluding that
                two strings are semantic duplicates. A good default is 0.7.
        """
        self._threshold = threshold
        self._encoder = hub.load(
            "https://tfhub.dev/google/universal-sentence-encoder/4"
        )

    def __call__(self, json_str):
        """Removes semantic duplicates in a text feed across different sources.

        Args:
            json_str: JSON string with source names (str) as keys. The values should be arrays of strings.

        Returns:
            JSON string, but with <= the original number of strings in each array compared to input JSON.
        """
        retval = json.loads(json_str)
        retval = self._dictify(retval)
        retval = self._fingerprint(retval)
        retval = self._remove_duplicates(retval)
        retval = self._undictify(retval)
        retval = json.dumps(retval)
        return retval

    def _dictify(self, data):
        """Converts dict of lists of strings into dict of lists of dicts.

        This is a utility method that makes the following methods a little easier to implement.

        Args:
            data: Dict with strings as keys. The values should be lists of strings.

        Returns:
            A dict, but the lists of strings (from the input) are now lists of dicts with a single key "text".
            The value for each "text" key corresponds to the string that each dict is replacing.
        """
        for source in data:
            for i in range(len(data[source])):
                data[source][i] = {"text": data[source][i]}
        return data

    def _fingerprint(self, data):
        """Adds 512D vectors (i.e. lists with 512 floats) to each text item in the feed for all sources.

        Args:
            data: Dict with source names (str) as keys. The values should be lists of dicts with one key: "text".
                Each value for each key "text" should be a string.

        Returns:
            A dict, the input, but now with an additional key for the nested dicts: "fingerprint", which is a list of
            512 floats.
        """
        for source in data:
            for obj in range(len(data[source])):
                data[source][obj]["fingerprint"] = self._encode(
                    data[source][obj]["text"]
                )
        return data

    def _remove_duplicates(self, data):
        """Performs a brute-force scan for text items that are semantically similar across different sources, and
        randomly removes all but one of them. The randomness prevents bias towards any particular source.

        Args:
            data: Dict with source names (str) as keys. The values should be lists of dicts with two keys: "text" and
                "fingerprint". The first key "text" should have a string value, and the second "fingerprint" should
                have a value of a list of 512 floats.

        Returns:
            Dict with source names (str) for keys. The values are lists of dicts with only the "text" key i.e. the
                "fingerprint" key has been removed. (It was only needed for this method.)
        """
        # We start by preparing the input.
        for source in data:
            for obj in range(len(data[source])):
                data[source][obj]["seen"] = False
        # Now we'll shuffle the input. This will provide a small amount of bias prevention in that it'll prevent the
        # same source from always going first between runs.
        uncleared_sources = [source for source in data]
        random.shuffle(uncleared_sources)
        # Begin algorithm.
        while len(uncleared_sources) > 0:
            # First, select a source.
            for chosen_source in uncleared_sources:
                # Now, go through the source until we find an item that wasn't seen.
                chosen_obj = -1
                for obj in range(len(data[chosen_source])):
                    if not data[chosen_source][obj]["seen"]:
                        chosen_obj = obj
                        break
                # If we didn't get anything, then we're done with this source.
                # Since all its items are seen, it's cleared, so we want to stop future iterations over this source.
                if chosen_obj == -1:
                    uncleared_sources.remove(chosen_source)
                    break
                # Otherwise, we gotta keep going. We look at all of the other sources and all of their items,
                # one-by-one. If we find a duplicate (via the fingerprints), we remove it.
                for other_source in uncleared_sources:
                    if (
                        other_source != chosen_source
                    ):  # Give meaning to the name "other_source".
                        for other_obj in reversed(range(len(data[other_source]))):
                            # Don't bother doing extra, unnecessary processing when we've already seen an item and
                            # made it unique by removing its duplicates.
                            if not data[other_source][other_obj]["seen"]:
                                sim = self._compute_sim(
                                    data[other_source][other_obj]["fingerprint"],
                                    data[chosen_source][chosen_obj]["fingerprint"],
                                )
                                if sim >= self._threshold:
                                    del data[other_source][other_obj]
                # Finally, we mark the original chosen item as seen.
                data[chosen_source][chosen_obj]["seen"] = True
                # After this, we'll go to the next source, pick an unseen item, and repeat the loop source-by-source,
                # going in a circle, until each gets cleared and there are no more sources to loop over.
        # Finalize by removing keys that are no longer needed.
        for source in data:
            for obj in range(len(data[source])):
                del data[source][obj]["fingerprint"]
                del data[source][obj]["seen"]
        return data

    def _undictify(self, data):
        """Undoes the _dictify method.

        Args:
            data: Dict with source names (str) as keys. The values should be lists of dicts with one key: "text".
                Each value for "text" should be a string.

        Returns:
            Input dict, but now with the nested dicts removed, so that the lists of dicts are now just lists of strings.
            Essentially the opposite operation of the _dictify method.
        """
        for source in data:
            for i in range(len(data[source])):
                data[source][i] = data[source][i]["text"]
        return data

    def _encode(self, text):
        """Encodes text into a 512D vector. Most suitable for short paragraphs or less.

        Args:
            text: String to encode.

        Returns:
            The encoded text as a list of 512 floats.
        """
        return self._encoder([text]).numpy().tolist()[0]

    def _compute_sim(self, a, b):
        """Computes the cosine similarity of two vectors, and scales between 0 and 1.

        Args:
            a: List of floats.
            b: List of floats. Should be same length as "a".

        Returns:
            Float representing cosine similarity, but scaled between 0 and 1.
        """
        dot_product = sum(i * j for i, j in zip(a, b))
        mag_a = sum(i ** 2 for i in a) ** 0.5
        mag_b = sum(i ** 2 for i in b) ** 0.5
        cosine_sim = dot_product / (mag_a * mag_b)
        scaled_sim = (cosine_sim + 1) / 2
        return scaled_sim


if __name__ == "__main__":
    json_str = sys.stdin.readline()
    sys.stdout.write(Deduper()(json_str))
    sys.stdout.flush()
