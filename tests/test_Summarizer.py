import json
import unittest

from src.Summarizer import Summarizer


class TestSummarizer(unittest.TestCase):
    def test_sanity_check(self):
        """Basic sanity check to ensure that class is working."""
        summarizer = Summarizer()
        fake_data = [
            "This morning, former President Jonald T. Rump announced that he would be running for re-election in 2024 against the Democratic incumbent, Boe J. Riden. The announcement has startled many Republicans, including Florida Gov. Don ReSanta, who has already announced his campaign. \"Look, I respect Rump,\" Mr. ReSanta was quoted as saying. \"But we just need someone else. The Republican party doesn't need someone who lost to Riden in 2020. If we want to take back the White House, it has to be through someone new.\" Later that day, Mr. Rump spat back, saying \"Stupid loser ReSanta is too afraid to say what he really thinks! He's mad that I'm running because it means that he's gonna get his ass kicked in the primaries! Sad!\" Democrats have also responded to the announcement with surprise. President Riden said in a statement that he was ready to take Rump on, and that he would beat him just like he did in 2020. Other Democrats have been a little more wary, worried that Rump's base would come back in a full force, and possibly lead to another round of violence at Capitol Hill if the election doesn't go Rump's way. Whatever happens, the 2024 election is looking to be the most intense in modern history. MSNABCNN correspondent Machel Raddow reporting.",
            'There\'s a new ice cream shop opening up at 7th Avenue... with a twist! The shop, named "Political Ice Cream," sells ice cream that is politically-themed! You thought the constant campaigning, ads, debates, opinion pieces, etc. weren\'t enough? No problem! At Political Ice Cream, you can theme your Ice Cream with political toppings, such as "Blue Wave" M&Ms, or "Make America Great Again" cookie crumbles! Yum, yum! Doesn\'t that sound delicious? Get yours at 7th Avenue today!',
        ]
        fake_data = json.dumps(fake_data)
        result = json.loads(summarizer(fake_data))

        self.assertTrue(len(result) == 2)

        EXPECTED_SUMMARY_0 = "Former President Jonald T. Rump announced that he would be running for re-election in 2024 against the Democratic incumbent, Boe J. Riden. Florida Gov. Don ReSanta has already announced his campaign. Democrats have also responded with surprise."
        self.assertTrue(result[0] == EXPECTED_SUMMARY_0)

        EXPECTED_SUMMARY_1 = 'Political Ice Cream is a new ice cream shop opening up at 7th Avenue. The shop, named "Political Ice Cream," sells ice cream that is politically-themed. You can theme your ice cream with political toppings, such as "Blue Wave" M&Ms.'
        self.assertTrue(result[1] == EXPECTED_SUMMARY_1)
