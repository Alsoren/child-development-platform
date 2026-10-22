# Project Management Plan (PMP)

> Each section is one Jira epic (PMP-1 … PMP-6); mark the epic Done when the section is complete.
> Screenshots are saved in `docs/img/`.

| Section | Content | Required by |
|---|---|---|
| PMP-1 | Project, Jira setup, team and roles | Week 6 |
| PMP-2 | Work packages (epics) and sprint plan | Week 6 |
| PMP-3 | Progress review: mid-term (v0.1) | Mid-term evaluation (Week 8 / 9) |
| PMP-4 | Progress review: v0.2 | Week 10 |
| PMP-5 | Progress review: final (v1.0) | Final evaluation |
| PMP-6 | Retrospective | Final evaluation |

---

## PMP-1. Project and Team

### Project and Jira Setup

**Team name:** Kardeşler Software  
**Project in one sentence:** A web platform that helps parents and caregivers track a child's growth, developmental milestones, health records and daily activities in one place.  
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

| Epic | Owner | Number of tasks | Planned sprint(s) |
|---|---|---|---|
| M1 – Authentication & User Accounts | Ahmet Alp Keleş | 6 | Sprint 1, 2 |
| M2 – Child Profiles | Ahmet Alp Keleş | 5 | Sprint 1, 2 |
| M3 – Growth Tracking | Okan Can Nazlı | 6 | Sprint 2, 3 |
| M4 – Developmental Milestones | Okan Can Nazlı | 6 | Sprint 2, 3 |
| M5 – Activities & Recommendations | Mehmet Belen | 5 | Sprint 3 |
| M6 – Health Records & Vaccinations | Mehmet Belen | 6 | Sprint 3, 4 |
| M7 – Reminders & Notifications | Ahmet Alp Keleş | 4 | Sprint 4 |
| M8 – Dashboard & Reports | Okan Can Nazlı | 5 | Sprint 4 |

### Sprint Plan

| Sprint | Weeks | Sprint goal | Ends with |
|---|---|---|---|
| Sprint 1 | 1–6 | Set up repo, CI, database and project skeleton; basic login and child profile creation | Walking skeleton (v0.0), Week 6 |
| Sprint 2 | 7–8 | Complete M1 and M2; start growth tracking and milestones | Release v0.1, mid-term |
| Sprint 3 | 9–10 | Complete M3, M4 and M5; health records and vaccination tracking working; end-to-end tests for the 3 critical flows | Release v0.2, Week 10 |
| Sprint 4 | 11–14 | Reminders, dashboard and reports; remaining health record features; bug fixing, polish and documentation | Release v1.0, final |

---

## PMP-3. Progress Review: Mid-term (v0.1)

**Jira board screenshot:** `docs/img/board-v0.1.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M1 – Authentication & User Accounts | Registration, login, logout, password hashing | _Update at review_ |
| M2 – Child Profiles | Create, view, edit and delete child profiles | _Update at review_ |
| M3 – Growth Tracking | Data model and first entry form | _Update at review_ |

**Changes to the plan (if any):** _None yet._

---

## PMP-4. Progress Review: v0.2

**Jira board screenshot:** `docs/img/board-v0.2.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M3 – Growth Tracking | Growth entries and charts complete | _Update at review_ |
| M4 – Developmental Milestones | Milestone checklist and progress per age group | _Update at review_ |
| M5 – Activities & Recommendations | Activity list and age-based suggestions | _Update at review_ |
| M6 – Health Records & Vaccinations | Health record entry, vaccination schedule, mark as done, upcoming/overdue status | _Update at review_ |

**Changes to the plan (if any):** _None yet._

---

## PMP-5. Progress Review: Final (v1.0)

**Jira board screenshot:** `docs/img/board-v1.0.png`  

| Epic | Planned for this point | Status (Done / In progress / Not started) |
|---|---|---|
| M6 – Health Records & Vaccinations | Complete, including allergies/conditions and editing or deleting records | _Update at review_ |
| M7 – Reminders & Notifications | Vaccination and checkup reminders | _Update at review_ |
| M8 – Dashboard & Reports | Dashboard summary and exportable report | _Update at review_ |

**Changes to the plan (if any):** _None yet._

---

## PMP-6. Retrospective

- What worked well in using Jira: _Fill in at the end of the project._
- What we would do differently: _Fill in at the end of the project._
