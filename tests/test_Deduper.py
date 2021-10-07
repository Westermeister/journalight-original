import json
import unittest

from src.Deduper import Deduper


class TestMerger(unittest.TestCase):
    def test_comprehensive(self):
        """Tests entire functionality."""
        d = Deduper(threshold=1)
        fake_data = {
            "source-a": [
                "I'm common to all 3 sources.",
                "I'm common to only sources A and B.",
            ],
            "source-b": [
                "I'm common to all 3 sources.",
                "I'm common to only sources A and B.",
            ],
            "source-c": ["I'm common to all 3 sources.", "I'm unique to source C."],
        }
        fake_data = json.dumps(fake_data)
        result = json.loads(d(fake_data))

        self.assertTrue(type(result) is dict)

        total = 0
        for source in result:
            for i in range(len(result[source])):
                total += 1
        self.assertTrue(total == 3)

        count_all_3 = 0
        count_only_a_and_b = 0
        count_unique_c = 0
        for source in result:
            for i in range(len(result[source])):
                if result[source][i] == "I'm common to all 3 sources.":
                    count_all_3 += 1
                if result[source][i] == "I'm common to only sources A and B.":
                    count_only_a_and_b += 1
                if result[source][i] == "I'm unique to source C.":
                    count_unique_c += 1
        self.assertTrue(count_all_3 == 1)
        self.assertTrue(count_only_a_and_b == 1)
        self.assertTrue(count_unique_c == 1)
