import { Problem } from "./calc";
function tableCalc(): Problem[] {
  return [
    {
      id: `table-0001`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$500	$343	$199,657
2	5/2023	$499	$344	$199,313
3	6/2023	$498	$345	$198,968
4	7/2023	$497	$346	$198,622
5	8/2023	$497	$347	$198,275
6	9/2023	$496	$348	$197,928
7	10/2023	$495	$348	$197,579
8	11/2023	$494	$349	$197,230
9	12/2023	$493	$350	$196,880
10	1/2024	$492	$351	$196,529
11	2/2024	$491	$352	$196,177
12	3/2024	$490	$353	$195,824

What is the total interest paid in these 12 months?`,
      expected: "5942 (dollars)",
    },
    {
      id: `table-0002`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$500	$343	$199,657
2	5/2023	$499	$344	$199,313
3	6/2023	$498	$345	$198,968
4	7/2023	$497	$346	$198,622
5	8/2023	$497	$347	$198,275
6	9/2023	$496	$348	$197,928
7	10/2023	$495	$348	$197,579
8	11/2023	$494	$349	$197,230
9	12/2023	$493	$350	$196,880
10	1/2024	$492	$351	$196,529
11	2/2024	$491	$352	$196,177
12	3/2024	$490	$353	$195,824

In which month is the most interest paid? Answer using the name of a month.`,
      expected: "April",
    },
    {
      id: `table-0003`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$500	$343	$199,657
2	5/2023	$499	$344	$199,313
3	6/2023	$498	$345	$198,968
4	7/2023	$497	$346	$198,622
5	8/2023	$497	$347	$198,275
6	9/2023	$496	$348	$197,928
7	10/2023	$495	$348	$197,579
8	11/2023	$494	$349	$197,230
9	12/2023	$493	$350	$196,880
10	1/2024	$492	$351	$196,529
11	2/2024	$491	$352	$196,177
12	3/2024	$490	$353	$195,824

What is the interest rate being paid? Answer as a percentage to one decimal place.`,
      expected: "3.0",
    },
    {
      id: `table-0004`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$500	$343	$199,657
2	5/2023	$499	$344	$199,313
3	6/2023	$498	$345	$198,968
4	7/2023	$497	$346	$198,622
5	8/2023	$497	$347	$198,275
6	9/2023	$496	$348	$197,928
7	10/2023	$495	$348	$197,579
8	11/2023	$494	$349	$197,230
9	12/2023	$493	$350	$196,880
10	1/2024	$492	$351	$196,529
11	2/2024	$491	$352	$196,177
12	3/2024	$490	$353	$195,824

What will be the ending balance after 24 repayments? Round to the nearest $10`,
      expected: "191520 (dollars)",
    },
    {
      id: `table-0005`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$578	$347	$211,653
2	5/2023	$577	$348	$211,305
3	6/2023	$576	$349	$210,955
4	7/2023	$575	$350	$210,605
5	8/2023	$574	$351	$210,254
6	9/2023	$573	$352	$209,902
7	10/2023	$572	$353	$209,549
8	11/2023	$571	$354	$209,195
9	12/2023	$570	$355	$208,840
10	1/2024	$569	$356	$208,484
11	2/2024	$568	$357	$208,128
12	3/2024	$567	$358	$207,770
  
What is the interest rate being paid? Answer as a percentage rounded to one decimal places.`,
      expected: "3.3",
    },
    {
      id: `table-0005`,
      grade: `8`,
      kind: `table`,
      question: `Month	Date	Interest	Principal	Ending Balance
1	4/2023	$578	$347	$211,653
2	5/2023	$577	$348	$211,305
3	6/2023	$576	$349	$210,955
4	7/2023	$575	$350	$210,605
5	8/2023	$574	$351	$210,254
6	9/2023	$573	$352	$209,902
7	10/2023	$572	$353	$209,549
8	11/2023	$571	$354	$209,195
9	12/2023	$570	$355	$208,840
10	1/2024	$569	$356	$208,484
11	2/2024	$568	$357	$208,128
12	3/2024	$567	$358	$207,770
  
What is the interest rate being paid? Answer as a percentage rounded to one decimal places.`,
      expected: "3.3",
    },
    {
      id: `table-0007`,
      grade: `8`,
      kind: `table`,
      question: `,Year,Activity Type,Activity Type Chapter,Percentage Value per Year
0,2011,CPT,Urinary System,0.78
1,2011,CPT,Respiratory System,1.01
2,2011,CPT,Radiology,3.02
3,2011,CPT,Radiologic Guidance,0.0
4,2011,CPT,Radiation Oncology,0.46
5,2011,CPT,Pathology & Laboratory,32.83
6,2011,CPT,Operating Microscope,0.0
7,2011,CPT,Nuclear Medicine,1.15
8,2011,CPT,Nervous System,0.19
9,2011,CPT,,0.05
10,2011,CPT,Musculoskeletal,1.61
11,2011,CPT,Mediastinum & Diaphragm,0.0
12,2011,CPT,Maternity Care & Delivery,1.93
13,2011,CPT,Male Genital System,0.14
14,2011,CPT,Integumentary,0.99
15,2011,CPT,Hemic & Lymphatic Systems,0.01
16,2011,CPT,General,0.02
17,2011,CPT,Female Genital System,0.31
18,2011,CPT,Eye & Ocular Adnexa,0.82
19,2011,CPT,Evaluation & Management,5.7
  
What is the activity type chapter with the highest value per year?`,
      expected: "Pathology & Laboratory",
    },
    {
      id: `table-0007`,
      grade: `8`,
      kind: `table`,
      question: `,Year,Activity Type,Activity Type Chapter,Percentage Value per Year
0,2011,CPT,Urinary System,0.78
1,2011,CPT,Respiratory System,1.01
2,2011,CPT,Radiology,3.02
3,2011,CPT,Radiologic Guidance,0.0
4,2011,CPT,Radiation Oncology,0.46
5,2011,CPT,Pathology & Laboratory,32.83
6,2011,CPT,Operating Microscope,0.0
7,2011,CPT,Nuclear Medicine,1.15
8,2011,CPT,Nervous System,0.19
9,2011,CPT,,0.05
10,2011,CPT,Musculoskeletal,1.61
11,2011,CPT,Mediastinum & Diaphragm,0.0
12,2011,CPT,Maternity Care & Delivery,1.93
13,2011,CPT,Male Genital System,0.14
14,2011,CPT,Integumentary,0.99
15,2011,CPT,Hemic & Lymphatic Systems,0.01
16,2011,CPT,General,0.02
17,2011,CPT,Female Genital System,0.31
18,2011,CPT,Eye & Ocular Adnexa,0.82
19,2011,CPT,Evaluation & Management,5.7
39,2011,Dental,"Restorations, Inlays, Onlays, Pins And Posts",0.04
40,2011,Dental,"Restorations, Amalgam",0.01
41,2011,Dental,Restoration,0.03
42,2011,Dental,Repairs,0.0
43,2011,Dental,"Removals, (Extractions), Surgical",0.07
44,2011,Dental,"Removals, (Extractions), Erupted Teeth",0.06
45,2011,Dental,"Remodelling And Recontouring Oral Tissues In Preparation For Removable Prostheses (To Include Codes 73110, 73120, 73140, 73150, 73160, 73170, 73180)",0.0
46,2011,Dental,"Recontouring Of Retainer/Pontics,(Of Existing Bridgework)",0.0
47,2011,Dental,"Radiographs, Specialty Use Only",0.0
48,2011,Dental,Radiographs (Including Radiographic Examination And Diagnosis And Interpretation),0.06
49,2011,Dental,"Pulp Chamber, Treatment Of, (Excluding Final Restoration)",0.07
50,2011,Dental,Professional Services,0.07
51,2011,Dental,"Preventive Services, Other",0.06
52,2011,Dental,"Pontics, Bridge",0.03
53,2011,Dental,Polishing,0.09
54,2011,Dental,Permanent Dentition,0.05
55,2011,Dental,"Periodontal Services, Surgical (Includes Local Anaesthetic, Suturing And The Placement And Removal Of Initial Surgical Dressing. A Surgical Site Is An Area That Lends Itself To One Or More Procedures. It Is Considered To Include A Full Quadrant, Sextant O",0.05
  
What is the average percentage value per year of Dental treatments? Answer with a percentage rounded to three decimal places.`,
      expected: "0.041",
    },
  ];
}

export function getProblems() {
  return [...tableCalc()];
}
