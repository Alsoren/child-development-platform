# Project Management Plan (PMP)

> Each section is one Jira epic (PMP-1 … PMP-6); mark the epic Done when the section is complete.
> Screenshots are saved in `docs/img/`.

| Section | Content | Required by |
|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Week 4 |
| PMP-2 | Work packages (epics) and sprint plan | Week 5 |
| PMP-3 | Progress review: mid-term (v0.1) | Week 7 |
| PMP-4 | Progress review: v0.2 | Week 9 |
| PMP-5 | Progress review: final (v1.0) | Week 11 |
| PMP-6 | Retrospective | Week 12 |

---

## PMP-1. Project and Team

### Project and Jira Setup

**Team name:** Kardeşler Software  
**Project in one sentence:** A web-based decision support platform that brings parents, specialists and the child together around one shared schedule, task list and record of observations, with an AI summary of the week written for each role (the AI supports decisions and never makes them).  
**Jira project key:** SCRUM  
**Jira board link:** https://ahmetalp.atlassian.net/jira/software/projects/SCRUM/boards/1  
**Team repository:** https://github.com/Alsoren/child-development-platform  
**CI pipeline:** https://github.com/Alsoren/child-development-platform/blob/main/.github/workflows/ci.yml  

### Team and Roles

| Name | Jira / GitHub username | Role |
|---|---|---|
| Ahmet Alp Keleş | Alsoren | Full stack |
| Okan Can Nazlı | okan-can-nazli | Full stack |
| Mehmet Belen | Mehmetbln | Full stack |

---

## PMP-2. Plan

### Work Packages (Epics)

The owner is responsible for the feature end to end (screen, API, data and tests).

| Epic | Owner | Number of tasks | Planned sprint(s) |
|---|---|---|---|
| M1 – Login and roles | Ahmet Alp Keleş | 6 | Sprint 2, 3 |
| M2 – Linking specialists | Ahmet Alp Keleş | 5 | Sprint 3 |
| M3 – Weekly schedule | Okan Can Nazlı | 3 | Sprint 3 |
| M4 – Tasks | Okan Can Nazlı | 3 | Sprint 3 |
| M5 – Specialist entries | Mehmet Belen | 4 | Sprint 4 |
| M6 – Documents | Mehmet Belen | 4 | Sprint 4 |
| M7 – Weekly statistics | Ahmet Alp Keleş | 3 | Sprint 4 |
| M8 – Role-based AI summary | Okan Can Nazlı | 6 | Sprint 4, 5 |

### Sprint Plan

Two-week sprints that follow the assignment calendar (weeks 3–13).

| Sprint | Weeks | Sprint goal | Ends with |
|---|---|---|---|
| Sprint 1 | 3–4 | Team, repository, Jira and CI set up; requirements specification draft; PMP-1 | SRS draft and PMP-1, Week 4 |
| Sprint 2 | 5–6 | Walking skeleton (SQLite, Express, React, one task end to end); start M1; PMP-2; SRS and design document final | Walking skeleton (v0.0), Week 5; SRS and SDD final, Week 6 |
| Sprint 3 | 7–8 | Complete M1–M4 (login and roles, linking specialists, weekly schedule, tasks); first end-to-end test in CI; PMP-3 | Release v0.1, Week 8 |
| Sprint 4 | 9–10 | M5–M8 (entries, documents, statistics, AI summary with mock mode); branch coverage ≥ 40%; end-to-end tests for the 3 critical flows; PMP-4 | Release v0.2, Week 10 |
| Sprint 5 | 11–12 | Bug fixing and polish; branch coverage ≥ 60%; an end-to-end test for each of M1–M8; final report; PMP-5 and PMP-6 | Release v1.0, Week 12 |

Week 13 is used for the presentation and live demo.

---

## PMP-3. Progress Review: Mid-term (v0.1)

**Jira board screenshot:** `docs/img/board-v0.1.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 – Login and roles | Email and password login, role-based screens, API rejects unauthorized requests | _Update at review_ |
| M2 – Linking specialists | Parent links and unlinks a specialist by email; unlinked specialist rejected in the API | _Update at review_ |
| M3 – Weekly schedule | Parent and linked specialists add events; weekly view | _Update at review_ |
| M4 – Tasks | Assign tasks, child marks done, assigner sees status | _Update at review_ |

**Changes to the plan (if any):** _None yet._

---

## PMP-4. Progress Review: v0.2

**Jira board screenshot:** `docs/img/board-v0.2.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M5 – Specialist entries | Dated observations, "edited" mark, hidden from the child | _Update at review_ |
| M6 – Documents | Upload, list and download PDF or image files, hidden from the child | _Update at review_ |
| M7 – Weekly statistics | Completion rate for a selected week, in total and by development area | _Update at review_ |
| M8 – Role-based AI summary | Summary for parent and specialist, "AI-generated" label, source records, mock mode | _Update at review_ |

Quality targets at this point: branch coverage ≥ 40%, end-to-end tests for the 3 critical flows.

**Changes to the plan (if any):** _None yet._

---

## PMP-5. Progress Review: Final (v1.0)

**Jira board screenshot:** `docs/img/board-v1.0.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 – M4 | Stable, covered by an end-to-end test each | _Update at review_ |
| M5 – M8 | Stable, covered by an end-to-end test each | _Update at review_ |
| Quality and documentation | Branch coverage ≥ 60%, README install check, final report | _Update at review_ |

**Changes to the plan (if any):** _None yet._

---

## PMP-6. Retrospective

- What worked well in using Jira: _Fill in at the end of the project._
- What we would do differently: _Fill in at the end of the project._


---
