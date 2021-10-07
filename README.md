# :newspaper: Contents

- [Introduction](#blush-hello-there)
- [Advanced usage](#sunglasses-advanced-usage)
- [How it works](#alien-how-it-works)

# :blush: Hello there!

Do you value your time? So many of us live busy lives. We have school, we have work, we have chores and errands. We have
families to take care of. We have our personal interests and hobbies. With so much going on, it's no wonder that staying
in the loop isn't a big priority.

Unfortunately, the news hasn't taken the hint. One look at popular sites like [CNN](https://www.cnn.com/) or
[Fox News](https://www.foxnews.com/) reveals a jumbled mess of headlines and links — an endless feed of sensationalist,
partisan clickbait :weary:

## :angry: We. Deserve. Better.

That's why *Journalight* exists! Instead of the cluttered mess that sites like CNN and Fox give you, how
about a *lightweight* form of journalism?

```
Fri May 28 2021

Good day. Your news briefing:

1. In East Jerusalem, Palestinian residents are facing forced removal by Israeli settler organizations. Rashid Khalidi guides us through the history of settlements and displacement going back to the age of European colonialism.

2. Germany's government apologized Friday for committing genocide during its occupation of what it is now Namibia, officially acknowledging the slaughter of two ethnic groups in the early 20th century.

3. Small Business Administrator Isabel Guzman will field questions on how the agency will continue to disperse pandemic relief funding as she testifies before a House appropriations subcommittee on Friday.

4. The wife of the Belgian ambassador to South Korea who assaulted two local women at a boutique in Seoul has agreed give up some diplomatic immunity.

5. New York City police are looking for a suspect caught on camera Wednesday punching a 75-year-old Asian woman in the city's borough of Queens.

6. Ralph "AK" Angkiangco enlisted in the Navy in April 2008 one year after graduating high school. The Navy trains its corpsmen at Joint Base San Antonio-Fort Sam Houston in Texas. Instructors taught him how to treat and prevent infections in the field, splint a broken bone and stop an arterial bleed. But there are some things that cannot be learned in a classroom.

7. In South Florida, when people want to find a doctor who's Black, they often end up contacting Adrienne Hibbert through her online website, Black Doctors of South Florida. Research has shown that racism, discrimination and unconscious bias continue to plague the U.S. health care system. Some Black patients say they'd prefer to work with Black doctors for their care, if they could find one.

8. A transit worker opened fire at a light-rail facility in downtown San Jose, Calif., fatally shooting nine people and taking his own life. San Jose Mayor Sam Liccardo says the gunman set fire to his own home before the shooting. The mayor says shootings of this scale are "uniquely American" He said attacks of this nature can be attributed to the number of firearms in circulation.

9. In Maine this month, roadside lobster rolls were going for as much as $34 each. Industry experts say this spring's prices are driven not just by a relatively low catch, but also by consumer habits. U.S. retail prices for seafood rose 19% in a 13-week period that ended just last month compared to the same period last year.

10. President Joe Biden will join Virginia Gov. Ralph Northam Friday morning to talk about the progress Virginia has made in the fight against the coronavirus.

11. Court ruling against Shell, Exxon Mobil: Real action on climate change means selling less oil. But this moment has been a long time coming, activists say. They argue that oil and gas is a bad long-term investment. Outright climate denial, while still prevalent in the U.S., is no longer in the political mainstream.

12. Twitter, which has long rumored to be working on a paid platform, listed a new subscription service in app stores Friday, but its features have yet to become available.

13. The Japanese central government on Friday extended its coronavirus state of emergency for nine prefectures to June 20 just a little more than a month before the scheduled opening ceremony of the Summer Olympic Games.

14. A rising inflation trend continues as prices rose by 3.6% in April from a year ago, reflecting increases in both goods and services, according to data released Friday by the Bureau of Economic Analysis.

15. State-owned Correos España issued a set of four stamps in different skin-colored tones. The darker the stamp, the lower the price. Critics accuse the company of having a tin ear for racial issues and misreading the sentiment of Black people in Spain. Campaign launched during European Diversity Month in collaboration with Spain's national SOS Racism Federation.

Sources:
1. https://www.npr.org/2021/05/25/1000247156/palestine
2. https://www.upi.com/Top_News/World-News/2021/05/28/germany-genocide-Africa-Namibia-apology/3141622200674/
3. https://www.upi.com/Top_News/US/2021/05/28/Small-Business-Administrator-Isabel-Guzman-House-financial-services-general-government-subcommittee/7361622169121/
4. https://www.upi.com/Top_News/World-News/2021/05/28/South-Korea-Belgian-ambassador-wife-immunity-give/2571622210162/
5. https://www.upi.com/Top_News/US/2021/05/28/New-York-elderly-Asian-woman-punched/8851622205337/
6. https://www.npr.org/2021/05/28/1000854565/a-path-to-peace-how-a-former-navy-corpsman-honors-his-fallen-friends-on-memorial
7. https://www.npr.org/sections/health-shots/2021/05/28/996603360/trying-to-avoid-racist-health-care-black-women-seek-out-black-obstetricians
8. https://www.npr.org/2021/05/27/1000893749/san-jose-shooting-victims-names-released-gunman-set-fire-to-his-own-home
9. https://www.npr.org/2021/05/28/1000850663/the-year-we-learned-to-cook-seafood-at-home-and-sent-prices-soaring
10. https://www.upi.com/Top_News/US/2021/05/28/Biden-Northam-Gottlieb-coronavirus/8021622211731/
11. https://www.npr.org/2021/05/28/1000882311/big-oil-faces-a-reckoning-decades-in-the-making
12. https://www.upi.com/Top_News/US/2021/05/28/twitter-blue-subscription-service/8361622203577/
13. https://www.upi.com/Top_News/World-News/2021/05/28/Japan-state-of-emergency-coronavirus-Olympics/2091622207564/
14. https://www.upi.com/Top_News/US/2021/05/28/price-index-rise-economic-analysis-fed-inflation/8851622210163/
15. https://www.npr.org/2021/05/28/1001228126/spains-new-postage-stamps-were-meant-to-call-out-racism-instead-they-drew-outrag
```

The above is actual output from *Journalight*. No mess, no clutter, no endless feed, no multi-paragraph
articles — just the major highlights of the day, along with sources if further reading is desired.

## :relieved: Much better, right?

If this kind of news is more appealing to you, feel free to give it a spin! *Journalight* is officially
supported, tested, and working with the following prerequisites:

- Ubuntu 20.04 LTS
- Node.js 16
- Python 3.8

**It will likely still work with older or newer versions of these prerequisites, although this is not officially
verified.**

To install, just [download the latest version](https://github.com/Westermeister/journalight-original/releases) and run
the following commands:

```
sed 's/#.*//' puppeteer-dependencies.txt | xargs sudo apt-get install
echo NODE_ENV=production > .env && npm install && npm run dist
pip install -r requirements.txt
```

To get the news:

```
npm start -- --all
```

This will take a few minutes to run. Afterwards, you'll see console output similar to what was shown above.

# :sunglasses: Advanced usage

## Customizing your news sources

*Journalight* currently supports the following sources for news *(with more to come in the future)*:

- [PBS NewsHour](https://www.pbs.org/newshour/)
- [National Public Radio (NPR)](https://www.npr.org/)
- [United Press International (UPI)](https://www.upi.com/)

*(NOTE: You can read more about why these sources were chosen in the [How it works](#alien-how-it-works) section.)*

Instead of using `npm start -- --all`, you can pick and choose your sources:

```
# Only PBS.
npm start -- --pbs

# Only NPR.
npm start -- --npr

# Only UPI.
npm start -- --upi

# Multiple sources e.g. only NPR and UPI.
npm start -- --npr --upi
```

## Archive already-seen news

If you were to run *Journalight* very frequently, you might occasionally notice old news. You can keep
track of news that's already been seen and filter it out using the `--archive` flag. For instance:

```
npm start -- --all --archive
```

This will generate a (hidden) file called `.archive.sqlite` which stores a database of already-seen news.
*Journalight* will automatically delete very old news (which has no threat of accidentally showing up 
again) in order to prevent this file from growing too large. :blush: How convenient!

If you don't want this functionality any longer, simply delete the file:

```
rm -f .archive.sqlite
```

## Send the news to your email address

*Journalight* features [Mailgun](https://www.mailgun.com/) integration, so you can send the news straight
to your email address!

1. First, you'll need to sign up for [Mailgun](https://www.mailgun.com/). 
   1. Mailgun has [decent documentation](https://documentation.mailgun.com/en/latest/) that will walk you through this. 
   2. After you've got a domain set up, you're gonna want to find your [private API
      key](https://help.mailgun.com/hc/en-us/articles/203380100-Where-Can-I-Find-My-API-Key-and-SMTP-Credentials-).
2. When you installed this program, a `.env` file was created. It's hidden because Linux happens to hide files that
   start with a period, but rest assured, it's there! You're going to want to add the following lines to it, replacing
   the stuff in the brackets with actual values:
   1. `FROM=Journalight <noreply@[INSERT YOUR MAILGUN DOMAIN]>`
   2. `TO=[INSERT YOUR EMAIL ADDRESS]`
   3. `MAILGUN_DOMAIN=[INSERT YOUR MAILGUN DOMAIN]`
   4. `MAILGUN_API_KEY=[INSERT YOUR PRIVATE API KEY]`
3. Here's an example of what your `.env` file might look like after you've finished.
   1. `FROM=Journalight <noreply@mydomain.com>`
   2. `TO=myemail@gmail.com`
   3. `MAILGUN_DOMAIN=mydomain.com`
   4. `MAILGUN_API_KEY=0123456789` (not a real key, yours will likely be a *lot* longer)
4. You're done! To receive the news, use the `--mail` flag. For example:

```
npm start -- --all --mail
```

## Combining the above options

You can combine all these options by simply adding them to the command. Here are some examples:

```
# Get news from PBS and UPI, and make sure to filter out news you've already seen from a previous run.
npm start -- --pbs --upi --archive

# Get news from NPR only, and mail it to your email address.
npm start -- --npr --mail

# Get the news from all sources, filter out already-seen news, and send the result to your email.
npm start -- --all --archive --mail

# ...and so on.
```

# :alien: How it works

The code is the best way to understand how *Journalight* works, although I will try to provide a general
overview in this section. More importantly, I aim to explain some of the design decisions behind
*Journalight*.

## How the sources were chosen

We all want unbiased news. To put it plainly, that's an incredibly difficult thing to get, especially post-Trump. Does
that mean it's impossible? Not entirely! **Some sources are worse than others.**  At the top of this post, I mentioned
sources like **CNN** and **Fox News**, who most people would agree cater to left and right-leaning audiences
respectively.

Many would say there's a simple answer: try to find sources that have a more **centrist bias**, and use those. As a
matter of fact, that's what *Journalight* tries to do! However, there are some **important caveats**:

1. **By far the biggest issue is that many, many news sources simply don't allow web scraping.** Attempting to
   programmatically retrive data from a website is often a violation of terms of service. This can result in a simple
   ban, but in extreme cases, civil suits are not an impossibility. Not to mention it's plain unethical.
2. Even if a news source *does* allow it, it can still be an *absolute pain* to do so in practice e.g. paywalls,
   frequent redesigns, archaic formatting, etc. Basically, just because it's kosher on paper, doesn't mean the reality
   is the same.
3. When it comes to bias, **it's crazy difficult to find news sources that both left and right-leaning folks trust.**
   Consider
   [this study](https://www.journalism.org/2020/01/24/democrats-report-much-higher-levels-of-trust-in-a-number-of-news-sources-than-republicans/)
   from the Pew Research Center. If you try to combine the set of news sources that both Democrats and Republicans
   trust, it's pathetically small.

You'll find that many sources that *would* be good candidates in terms of bias often violate one of the other criteria.
Long story short, it's complicated, and the devil is always in the details. As it stands currently, the set of sources
that *Journalight* uses has a **slight left-leaning bias** as ascertained by the [aforementioned
study](https://www.journalism.org/2020/01/24/democrats-report-much-higher-levels-of-trust-in-a-number-of-news-sources-than-republicans/).

## How the feed is generated

1. After *Journalight* scrapes the articles, it runs them through a machine learning model that summarizes
   each of them.
2. Then, the program uses another machine learning model to scan for "semantic duplicates" — basically, articles about
   the same topic. It randomly chooses a single source's article as the "one and only" version, and removes the other
   duplicates. This randomness helps prevent bias towards any one source.
3. Finally, the feeds from all the sources are merged into a single feed in random order; once again, the randomness is
   used to prevent any one source from consistently being put first, and thus prevent bias towards any one source.
