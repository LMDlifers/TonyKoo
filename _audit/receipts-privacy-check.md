# Receipts privacy check (2026-11-10)

Question: the report receipts link to each report's first commit and its history. Does any past version hold text from before sanitisation?

Method: `git log -p --follow -- reports/` (5,765 lines across 8 reports, 6 to 11 commits each). Every removed line was read. All added and removed lines were scanned for email addresses, NRIC-style IDs, Singapore phone numbers, student matric numbers, named professors or doctors, teammates, supervisors, and "confidential" markers.

Result for reports: pass.
- No hits for personal identifiers in any version.
- The removed lines are image references, captions, and page metadata. The images they point to (`images/reports/*_original.png`, `rentlock_ai_evaluation_cropped.png`) are all still in the current tree, so the history exposes nothing the live site does not already serve.

Separate finding, outside the reports: the repository history still contains two deleted files:
- `files/Resume_ValaryLim.pdf`, deleted in 8968eb4. This is another person's resume.
- `files/BT4221_Group2_Final_Project_Report.pdf`, deleted in da75aad. This is a group project report.

Both can still be downloaded from public GitHub history. The receipts do not link to them. Removing them needs a history rewrite, which is the repo owner's decision.
