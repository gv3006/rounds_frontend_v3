/* Rounds static reference data. No live or licensed metrics live here. */
import type { ReferenceData } from '../types';

export const referenceData: ReferenceData = {
// Licensed / credentialed positions seen across a hospital. Tags are self-reported and stay "Verification pending" in this prototype.
roles:[
['Physicians',['Physician (MD)','Physician (DO)','Resident physician','Fellow physician']],
['Advanced practice',['Nurse practitioner (NP)','Physician assistant (PA)','Certified registered nurse anesthetist (CRNA)','Certified nurse midwife (CNM)','Clinical nurse specialist (CNS)']],
['Nursing',['Registered nurse (RN)','Licensed practical nurse (LPN)']],
['Pharmacy',['Pharmacist (PharmD)']],
['Rehabilitation',['Physical therapist (PT)','Occupational therapist (OT)','Speech-language pathologist (SLP)']],
['Allied health',['Respiratory therapist (RT)','Registered dietitian (RD)','Radiologic technologist','Medical laboratory scientist','Paramedic']],
['Behavioral health',['Psychologist','Licensed clinical social worker (LCSW)']],
['Training',['Medical student','Nursing student']]
],
seeking:['Coauthor','Principal investigator (PI)','Co-PI','Statistician','Data analyst','Clinical site','Student researcher','Methods advisor'],
irbStatuses:['Not yet submitted','Submitted / under review','Approved','Exempt','Not required (no human subjects)'],
jobPositions:['Physician (MD/DO)','Resident / Fellow','Nurse practitioner','Physician assistant','Registered nurse','Pharmacist','Physical / occupational therapist','Research assistant','Research coordinator','Data analyst / Statistician','Coauthor / Reviewer'],
jobTypes:['Full-time','Part-time','Project-based','Collaboration','Fellowship','Volunteer'],
jobModes:['Remote','Hybrid','On-site'],
// Demo impact levels 1–4 (4 = highest). Placeholders only — NOT Journal Impact Factors. Replace with licensed data before launch.
impact:{nejm:4,lancet:4,jama:4,bmj:4,natmed:4,nrcardio:4,nrneurol:4,nrclinonc:4,nrendo:4,nrgastro:4,nrrheum:4,nrimmun:4,lancetneuro:4,lancetonc:4,lancetpsy:4,lancetinf:4,natneuro:4,
annals:3,jamaopen:3,plosmed:3,jamacardio:3,jacc:3,circulation:3,ehj:3,jamaneuro:3,brain:3,jamaonc:3,jco:3,cancerdisc:3,jamainternal:3,jamapsych:3,ajpsy:3,biolpsy:3,jamapeds:3,jamasurg:3,annsurg:3,jamaderm:3,radiology:3,cid:3,anesth:3,
stroke:2,pain:2,jgm:2,jbjs:2,ajsm:2,annem:2,pediatrics:2,bjs:2,jaad:2,bjd:2,jid:2,ajog:2,bja:2,resuscitation:2,
pmr:1,archpmr:1,jrehabmed:1,spine:1,arthroscopy:1,academicem:1,jpeds:1,ajron:1,eurorad:1,obg:1,bjog:1,rapm:1},
// Default journal sources for each specialty feed (general journals included).
defaultSpecJournals:{
cardiology:['jacc','circulation','ehj','jamacardio','nejm','lancet','jama'],
neurology:['lancetneuro','jamaneuro','brain','stroke','nejm','lancet','jama'],
oncology:['jco','lancetonc','jamaonc','cancerdisc','nejm','lancet','jama'],
rehabilitation:['archpmr','pmr','jrehabmed','pain','nejm','lancet','jama'],
internal:['annals','jamainternal','jgm','nejm','lancet','jama','bmj'],
orthopedics:['jbjs','ajsm','arthroscopy','nejm','lancet','jama'],
psychiatry:['ajpsy','jamapsych','lancetpsy','nejm','lancet','jama'],
emergency:['annem','academicem','resuscitation','nejm','lancet','jama'],
pediatrics:['pediatrics','jamapeds','jpeds','nejm','lancet','jama'],
surgery:['annsurg','jamasurg','bjs','nejm','lancet','jama'],
dermatology:['jaad','jamaderm','bjd','nejm','lancet','jama'],
radiology:['radiology','ajron','eurorad','nejm','lancet','jama'],
infectious:['cid','lancetinf','jid','nejm','lancet','jama'],
obgyn:['obg','ajog','bjog','nejm','lancet','jama'],
anesthesiology:['anesth','bja','rapm','nejm','lancet','jama']
},
// Quick-select subtags per specialty: [label, Europe PMC query clause]
subtags:{
cardiology:[['Heart failure','"heart failure"'],['Arrhythmia & EP','(arrhythmia OR "atrial fibrillation" OR electrophysiology)'],['Interventional','(PCI OR "percutaneous coronary" OR TAVR)'],['Prevention & lipids','(lipid OR statin OR "cardiovascular prevention")'],['Hypertension','hypertension'],['Valvular','(valvular OR "aortic stenosis" OR "mitral")'],['Cardiac imaging','(echocardiography OR "cardiac MRI" OR "coronary CT")']],
neurology:[['Stroke','(stroke OR cerebrovascular)'],['Epilepsy','(epilepsy OR seizure)'],['Dementia','(dementia OR alzheimer)'],['Movement disorders','(parkinson OR "movement disorder")'],['Multiple sclerosis','"multiple sclerosis"'],['Headache','(migraine OR headache)'],['Neuromuscular','(neuropathy OR "neuromuscular" OR ALS)']],
oncology:[['Breast','"breast cancer"'],['Lung','"lung cancer"'],['GI cancers','(colorectal OR pancreatic OR gastric) AND cancer'],['Hematologic','(leukemia OR lymphoma OR myeloma)'],['Immunotherapy','(immunotherapy OR "checkpoint inhibitor")'],['Radiation oncology','radiotherapy'],['Survivorship','(survivorship OR "quality of life") AND cancer']],
rehabilitation:[['Spine & back pain','("low back pain" OR spine)'],['Stroke rehab','(stroke AND rehabilitation)'],['Spinal cord injury','"spinal cord injury"'],['Brain injury','("traumatic brain injury" OR concussion)'],['Musculoskeletal','musculoskeletal'],['Interventional pain','("epidural" OR "radiofrequency ablation" OR "nerve block")'],['Sports medicine','("sports medicine" OR athlete)']],
internal:[['Diabetes','diabetes'],['Hypertension','hypertension'],['Kidney','("chronic kidney disease" OR nephrology)'],['GI & liver','(gastroenterology OR hepatology OR cirrhosis)'],['Pulmonary','(COPD OR asthma OR pulmonary)'],['Hospital medicine','("hospital medicine" OR inpatient)'],['Geriatrics','(geriatric OR "older adults")']],
orthopedics:[['Arthroplasty','arthroplasty'],['Sports injuries','("ACL" OR "rotator cuff" OR "sports injury")'],['Trauma & fracture','fracture'],['Spine surgery','("spine surgery" OR "spinal fusion")'],['Hand & upper limb','(hand OR wrist OR elbow) AND surgery'],['Foot & ankle','(foot OR ankle)']],
psychiatry:[['Depression','depression'],['Anxiety','anxiety'],['Psychosis','(schizophrenia OR psychosis)'],['Substance use','("substance use" OR addiction OR opioid)'],['Child & adolescent','(adolescent OR child) AND psychiatric'],['Psychotherapy','(psychotherapy OR "cognitive behavioral")']],
emergency:[['Resuscitation','(resuscitation OR "cardiac arrest")'],['Trauma','trauma'],['Sepsis','sepsis'],['Toxicology','(poisoning OR overdose OR toxicology)'],['Point-of-care US','("point-of-care ultrasound" OR POCUS)'],['Prehospital','(prehospital OR "emergency medical services")']],
pediatrics:[['Neonatology','(neonatal OR preterm)'],['Pediatric infections','(infection OR vaccine) AND pediatric'],['Development','(developmental OR autism)'],['Adolescent health','adolescent'],['Pediatric critical care','("pediatric intensive care" OR PICU)']],
surgery:[['General surgery','("general surgery" OR appendectomy OR cholecystectomy)'],['Minimally invasive','(laparoscopic OR robotic)'],['Surgical oncology','("surgical oncology" OR resection)'],['Transplant','transplantation'],['Vascular','("vascular surgery" OR aneurysm)'],['Perioperative outcomes','(postoperative complications OR "enhanced recovery")']],
dermatology:[['Psoriasis','psoriasis'],['Atopic dermatitis','("atopic dermatitis" OR eczema)'],['Melanoma & skin cancer','(melanoma OR "skin cancer")'],['Acne','acne'],['Hair & nails','(alopecia OR nail)']],
radiology:[['Neuroradiology','(neuroradiology OR "brain MRI")'],['Body imaging','("abdominal CT" OR "body imaging")'],['Breast imaging','(mammography OR "breast imaging")'],['Interventional','"interventional radiology"'],['AI in imaging','("deep learning" OR "artificial intelligence") AND imaging']],
infectious:[['Antimicrobial resistance','("antimicrobial resistance" OR "antibiotic resistance")'],['HIV','HIV'],['Respiratory viruses','(influenza OR COVID-19 OR RSV)'],['Vaccines','vaccine'],['Hospital infections','("healthcare-associated infection" OR "hospital-acquired")'],['Tuberculosis','tuberculosis']],
obgyn:[['Obstetrics','(pregnancy OR obstetric)'],['Maternal-fetal medicine','("maternal-fetal" OR preeclampsia)'],['Reproductive endocrinology','(infertility OR IVF)'],['Gynecologic oncology','("ovarian cancer" OR "cervical cancer" OR "endometrial cancer")'],['Contraception','contraception']],
anesthesiology:[['Regional anesthesia','("regional anesthesia" OR "nerve block")'],['Perioperative medicine','perioperative'],['Critical care','("intensive care" OR "critical care")'],['Pain medicine','("pain management" OR analgesia)'],['Airway','(airway OR intubation)']]
},
// Oxford CEBM 2011 levels (treatment-benefit column, simplified wording)
levels:[['1','Level 1 — Systematic review of randomized trials or n-of-1 trials'],['2','Level 2 — Randomized trial, or observational study with dramatic effect'],['3','Level 3 — Non-randomized controlled cohort / follow-up study'],['4','Level 4 — Case series, case-control, or historically controlled study'],['5','Level 5 — Mechanism-based reasoning / expert opinion']],
grade:[['high','High certainty'],['moderate','Moderate certainty'],['low','Low certainty'],['verylow','Very low certainty']],
// Standardized appraisal tools: domain structure only. Users should apply each tool's full official guidance for formal reviews.
tools:{
rob2:{name:'RoB 2',full:'Cochrane risk-of-bias tool for randomized trials (v2)',design:'Randomized trial',options:[['low','Low risk of bias'],['some','Some concerns'],['high','High risk of bias']],domains:[
['randomization','D1 · Randomization process','Was allocation random and concealed? Were baseline differences compatible with chance?'],
['deviations','D2 · Deviations from intended interventions','Were participants/carers aware of assignment, and did deviations arise that could affect the outcome?'],
['missing','D3 · Missing outcome data','Were outcome data available for (nearly) all participants? Could missingness depend on the true value?'],
['measurement','D4 · Measurement of the outcome','Was the measurement method appropriate and similar between groups? Were assessors blinded?'],
['reporting','D5 · Selection of the reported result','Was the analysis prespecified, and is selective reporting among outcomes or analyses unlikely?']]},
robinsi:{name:'ROBINS-I',full:'Risk Of Bias In Non-randomized Studies of Interventions',design:'Non-randomized study of an intervention',options:[['low','Low'],['moderate','Moderate'],['serious','Serious'],['critical','Critical'],['ni','No information']],domains:[
['confounding','Bias due to confounding','Were important confounders measured and controlled for appropriately?'],
['selection','Bias in selection of participants','Was selection into the study related to both intervention and outcome?'],
['classification','Bias in classification of interventions','Were intervention groups clearly defined and recorded at the start?'],
['deviations','Bias due to deviations from intended interventions','Were there deviations beyond usual practice that were unbalanced between groups?'],
['missing','Bias due to missing data','Were outcome, intervention, or confounder data missing for a meaningful proportion?'],
['measurement','Bias in measurement of outcomes','Could outcome assessment have been influenced by knowledge of the intervention received?'],
['reporting','Bias in selection of the reported result','Is the reported result likely selected from multiple outcomes, analyses, or subgroups?']]},
nos:{name:'Newcastle–Ottawa Scale',full:'Newcastle–Ottawa Scale for cohort and case-control studies',design:'Cohort or case-control study',options:[],domains:[
['selection','Selection (0–4 stars)','Representativeness of the cohort/cases, selection of comparison group, ascertainment of exposure, outcome absent at start.',[['4','★★★★ 4 stars'],['3','★★★ 3 stars'],['2','★★ 2 stars'],['1','★ 1 star'],['0','0 stars']]],
['comparability','Comparability (0–2 stars)','Were groups comparable on the most important factor and any additional factor (design or analysis)?',[['2','★★ 2 stars'],['1','★ 1 star'],['0','0 stars']]],
['outcome','Outcome / exposure (0–3 stars)','Assessment of outcome or exposure, adequate follow-up length, adequacy of follow-up / non-response.',[['3','★★★ 3 stars'],['2','★★ 2 stars'],['1','★ 1 star'],['0','0 stars']]]]},
quadas2:{name:'QUADAS-2',full:'Quality Assessment of Diagnostic Accuracy Studies (v2)',design:'Diagnostic accuracy study',options:[['low','Low risk'],['high','High risk'],['unclear','Unclear risk']],domains:[
['patients','Patient selection','Was a consecutive or random sample enrolled? Were inappropriate exclusions and case-control designs avoided?'],
['index','Index test','Were index test results interpreted without knowledge of the reference standard? Was any threshold prespecified?'],
['reference','Reference standard','Is the reference standard likely to correctly classify the target condition, and interpreted blind to the index test?'],
['flow','Flow and timing','Was the interval appropriate? Did all patients receive the same reference standard and get included in the analysis?']]},
amstar2:{name:'AMSTAR 2',full:'A MeaSurement Tool to Assess systematic Reviews (v2) — critical domains',design:'Systematic review / meta-analysis',options:[['yes','Yes'],['partial','Partial yes'],['no','No'],['na','Not applicable']],domains:[
['protocol','Item 2 · Protocol registered before the review','Did the report state that methods were established before the review was conducted?'],
['search','Item 4 · Comprehensive literature search','Did the authors use a comprehensive literature search strategy?'],
['exclusions','Item 7 · Justified exclusions','Did the authors list excluded studies and justify the exclusions?'],
['rob','Item 9 · Risk of bias in included studies','Did the authors use a satisfactory technique to assess risk of bias in individual studies?'],
['metaanalysis','Item 11 · Appropriate meta-analytic methods','If meta-analysis was performed, were appropriate methods used to combine results?'],
['robinterpretation','Item 13 · Risk of bias considered in interpretation','Did the authors account for risk of bias when interpreting or discussing the results?'],
['pubbias','Item 15 · Publication bias','If quantitative synthesis was performed, was small-study / publication bias investigated and discussed?']]},
generic:{name:'General appraisal',full:'Rounds general appraisal prompts (not a validated instrument)',design:'Other / unclear design',options:[['favorable','No major concern noted'],['uncertain','Some concerns / unclear'],['concerning','Important limitations noted'],['na','Not applicable']],domains:[
['question','Research question','Is the study objective clear, important, and specified?'],
['design','Study design','Is the design appropriate for the stated question?'],
['selection','Selection & sampling','Could recruitment, eligibility, or attrition introduce bias?'],
['measurement','Measurement','Are exposures, outcomes, and instruments defined and measured well?'],
['confounding','Confounding & bias','Were important alternative explanations addressed?'],
['analysis','Statistical analysis','Are methods, assumptions, multiplicity, and missing data adequately handled?'],
['interpretation','Interpretation','Are the conclusions calibrated to the observed results?'],
['applicability','Clinical applicability','How transferable are the findings to a relevant population or setting?']]}
},
// Publication taxonomy. `group` drives card treatment and the publication-type filter; `tier` is the typical
// Oxford CEBM level for that design (orientation only — the actual level depends on the question and execution).
studyTypes:{
meta:{label:'Systematic review & meta-analysis',short:'Meta-analysis',group:'synthesis',tier:1},
sr:{label:'Systematic review',short:'Systematic review',group:'synthesis',tier:1},
rct:{label:'Randomized controlled trial',short:'RCT',group:'research',tier:2},
cohort:{label:'Cohort study',short:'Cohort',group:'research',tier:3},
diagnostic:{label:'Diagnostic accuracy study',short:'Diagnostic accuracy',group:'research',tier:3},
casecontrol:{label:'Case–control study',short:'Case–control',group:'research',tier:4},
cross:{label:'Cross-sectional study',short:'Cross-sectional',group:'research',tier:4},
caseseries:{label:'Case series / case report',short:'Case series',group:'research',tier:4},
trans:{label:'Translational / laboratory study',short:'Translational',group:'research',tier:5},
research:{label:'Original research (design not indexed)',short:'Research',group:'research',tier:0},
review:{label:'Narrative review',short:'Review',group:'review',tier:5},
guideline:{label:'Guideline / consensus statement',short:'Guideline',group:'guidance',tier:0},
editorial:{label:'Editorial',short:'Editorial',group:'commentary',tier:0},
comment:{label:'Commentary',short:'Comment',group:'commentary',tier:0},
letter:{label:'Letter / correspondence',short:'Letter',group:'commentary',tier:0},
brief:{label:'News or short item (no abstract indexed)',short:'Brief',group:'commentary',tier:0},
notice:{label:'Correction or retraction notice',short:'Notice',group:'notice',tier:0}
},
pubGroups:[['research','Original research'],['synthesis','Systematic reviews'],['review','Narrative reviews'],['guidance','Guidelines'],['commentary','Editorials, comments & briefs']],
discussionSections:[['question','Clinical question','What question does this paper try to answer, and why does it matter?'],['findings','Key findings','What did the authors report? Cite numbers where you can.'],['strengths','Strengths','What did the study do well methodologically?'],['limitations','Limitations','What weakens confidence in the results?'],['bottomline','Bottom line','How should this change (or not change) practice or future research?']]
};
