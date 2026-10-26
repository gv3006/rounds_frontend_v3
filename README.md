# Rounds — Research discovery front-end prototype

A multi-view, interactive front-end prototype for discovering, discussing and critically evaluating medical research, and finding research collaborations.

## Start locally

From this folder, run `python -m http.server 8080` and visit http://localhost:8080. Alternatively use VS Code Live Server. `index.html` depends on `styles.css`, `data.js`, `mock-data.js`, and `app.js`.

For a portable one-file alternative (no local asset dependencies), use `rounds_next.html` provided separately.

## Information architecture (v4 redesign)

Primary navigation is five destinations: **Feed, Explore, Discussions, Collaborate, Library**. Followed specialties appear once, under the primary nav; profile and About live in the sidebar footer; Jobs is a tab inside Collaborate; Activity is a tab inside Library.

- **Feed** has two scopes. *For you* = specialties you follow + journals on your shelf, each card says why it appears. *Discover* = everything. *Tune feed* manages both follows and the journal shelf in one place.
- **Filters**: specialty (+ subspecialty chips), study design, publication date, open access, and *More* (publication type, journal, minimum citations, community-appraised). Option counts show what each choice returns. Sorts: best match, newest, most cited, trending, most discussed.
- **Paper cards** show study type, sample size, specialty / subspecialty, journal, authors, date, a one-line key finding, topics, citations, saves, discussions, and a community risk-of-bias bar. Actions: Save (to collections), Discuss, Appraise, copy link. Editorials, comments, letters, and news briefs get a compact row and are nested under the paper they discuss; correction notices are hidden.
- **Right rail**: trending in your specialties, most-discussed papers, emerging topics, open collaborations. On a paper page it shows related studies.
- **Library**: saved papers organized into collections, your appraisals, and activity.

### Data sources

`mock-data.js` holds a **fictional sample dataset** (papers, findings, community activity, topic trends). It is the default so the full experience can be demonstrated, and it is labelled "Sample" throughout the UI. The status bar above the feed switches to **Live · Europe PMC**. Live records are normalized to the same shape (`normalizeLive` in `app.js`): study type comes from indexed publication types and abstract wording, sample size and conclusions are parsed from the abstract, future print dates are never shown as the publication date ("Online first" instead), specialty is taken from specialty journals or keyword scoring (weak matches stay "General medicine"), unindexed items without abstracts are treated as briefs, and duplicate titles are collapsed. Replace `mock-data.js` with an API returning the `normalizeMock` shape to retire the sample data.

## Available front-end views

- Home, personalized journal feed, and specialty-specific journal-filtered feeds (Europe PMC attempted at runtime)
- Browse 15 specialties, choose journals for Your Feed, and filter literature
- Publication records with abstract, citation metadata, original publication link, notes and local saves
- Structured 8-domain critical appraisal (private draft, *not* a formal validated risk-of-bias instrument)
- Express Interest with optional reasons (not approval or scientific endorsement)
- Discussions tied to papers (local drafts only)
- Collaboration concept listings and ability to create drafts
- Opportunity listing examples and local draft forms
- Profile with self-reported roles clearly marked **unverified**
- Activity summary and saved research

## v3 feature additions

Static reference data (role list, subtags, demo impact tiers, default specialty journals, appraisal tools) lives in `data.js`, which loads before `app.js`.

- **Curation controls**: time window (today → all time) and ranking (newest, most cited, hot/trending, most interest) on Home, Your Feed, specialty, and search. *Hot* = Europe PMC citations per day since publication, re-ranked within the loaded page. *Most interest* uses only this browser's own signals; no community data exists yet.
- **Subtag bar**: quick topic chips across the top of Home, Your Feed, and specialty pages narrow the Europe PMC query.
- **Per-specialty journal sources**: each specialty has its own default journal selection (editable, with "Reset to defaults"), separate from Your Feed.
- **Specialty tags in general journals**: in the journal library (Your Feed → Browse all journals), selected general journals show a tag pill. Use it to tag, for example, NEJM with Cardiology so Your Feed only pulls cardiology-matching NEJM papers (keyword matching, so it isn't perfect).
- **Impact tier slider**: filters journals by **demo tiers 1–4**. These are placeholders, **not Journal Impact Factors**. Replace them with licensed data before launch.
- **Bookshelf**: selected journals appear face-out as covers on a CSS-drawn wooden shelf. The same shelf appears in Your Feed, on every specialty page, and in the journal library. Click a cover to remove it, or use the **Add journal** slot to open the library.
- **Papers / Discussions tabs** on each specialty page and on Your Feed.
- **Standardized study assessment**: tool picker (RoB 2, ROBINS-I, Newcastle–Ottawa, QUADAS-2, AMSTAR 2 critical domains, or general prompts). The tool is auto-suggested from publication type and abstract, and each domain has its own rating and comment box. It also records Oxford CEBM 2011 level of evidence and GRADE certainty. The form follows each tool's domain structure only, so formal reviews should apply the official guidance.
- **Evidence discussion format**: a 3-step flow (choose paper → rate evidence → structured post with clinical question, findings, strengths, limitations, and bottom line).
- **Citations**: a "Cite a paper" button on every discussion and comment field inserts numbered `[n]` references. You can cite from your reading, a Europe PMC search, or a pasted DOI/PMID. References render as a linked list.
- **Paper ratings and comments**: a private 1–5 star rating and a comments tab on each paper. Discussions also accept comments.
- **Licensed-role tags**: add hospital roles (MD, NP, RN, PharmD, PT, …) on your profile. Tags always show **Verification pending** because no verification service exists. License numbers are deliberately not collected.
- **Collaborate**: projects record IRB status, protocol number, institution, and the approval letter *file name only* (no upload, self-reported). They also list roles sought (coauthor, PI, statistician, …) and can be filtered by them.
- **Jobs**: filters by specialty, position, type, and arrangement. Local job drafts can include a contact link.
- **About** page explaining the purpose and the prototype's limits.

## Imagery

Specialties use plain two-letter badges rather than artwork. Journal covers come from publisher or Wikimedia URLs; when one is missing or fails to load, a typographic placeholder cover is shown.

## Prototype limitations

This is not a production application. It contains no login/identity verification, public posting, database, moderation, submissions, IRB verification, or live job board. Local drafts are stored in the browser `localStorage`, and example research papers/positions/projects are identified as demonstration samples. When Europe PMC cannot be reached, the feed falls back to clearly marked fictional papers for design demonstration. Do not confuse citation counts with research validity.

## Engineering handoff

For production, migrate into a typed UI with reusable page/card components; introduce a real API layer for publication metadata, pagination, specialty classification, identity verification and moderated collaboration. Add server-backed accounts, privacy/consent and authorization, publication source licensing/attribution, accessible keyboard interactions, and automated tests before launch.

## Your Feed / Journal source controls (v3)

- Navigate to **Your Feed** and manage exactly which journal titles appear in the reading feed.
- Every specialty contains a dedicated journal source shelf and a **View all** journal browser. General medical journals are eligible in every specialty, with subject filtering applied within the specialty page.
- The modal supports search, specialty-specific filtering, and selected-only filtering. Selections persist in browser `localStorage`.
- Europe PMC queries use its `JOURNAL` search field and combine selected titles with the existing specialty search. Citation metrics and filtering depend on Europe PMC availability/indexing.
- Journal tiles show *representative issue covers* hotlinked from Wikipedia’s journal infoboxes (non-free files used there for identification) or from the publishers’ public cover URLs (Elsevier, Springer Nature, Wiley, Oxford Academic, Wolters Kluwer/Ovid, RSNA, BMJ, JAMA Network). NEJM shows its public-domain wordmark from Wikimedia Commons. The Journal of Rehabilitation Medicine has no print cover, so it uses an **original Rounds-designed placeholder**, which is also the fallback when any cover fails to load. Issue-specific publisher URLs can change when new issues come out. Publisher cover assets are **not bundled** in this ZIP and remain with their original rights holders. Before production/commercial launch, obtain appropriate rights or a formal licensed feed for cover thumbnails; hotlinking is not permission.
- No publishers sponsor or endorse Rounds. Personal feed selections are not journal subscriptions, paywall bypasses, or alerts sent by the journals.
