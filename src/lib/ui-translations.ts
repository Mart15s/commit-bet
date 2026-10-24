// Additional keys are merged into the existing EN/LT dictionaries in i18n.ts.
export const uiTranslations = {
  en: {
    "Proof and review data could not be loaded. No evidence state has been inferred.": "Proof and review data could not be loaded. No evidence state has been inferred.",
    "Retry": "Retry",
    "THE PROMISE": "THE PROMISE",
    "THE PROOF": "THE PROOF",
    "Uploaded by": "Uploaded by",
    "Uploaded artifact. Source and authorship have not been independently verified.": "Uploaded artifact. Source and authorship have not been independently verified.",
    "project.planSize":
      "This draft has {count} tasks for a {days}-day sprint. Consider trimming scope before starting.",
    "project.proofExpectations":
      "Each task needs evidence a teammate can open and compare with the acceptance criteria.",
    "task.help.todo":
      "The assignee can start this task, then add proof that meets the acceptance criteria.",
    "task.help.in_progress":
      "Work is underway. Add reviewable evidence, then submit the task to a teammate.",
    "task.help.submitted":
      "Evidence is waiting for a teammate’s review. The assignee cannot approve their own work.",
    "task.help.needs_changes":
      "Read the reviewer’s reason, improve the proof, then submit again.",
    "task.help.rejected":
      "The evidence was rejected. Read the review reason, revise the work, or open a dispute with an explanation.",
    "task.help.disputed":
      "The project owner reviews the evidence and AI recommendation before confirming a resolution.",
    "task.help.approved":
      "A teammate approved this work. It counts toward verified project completion.",
    "nav.skip": "Skip to content",
    "nav.sprints": "Sprints",
    "nav.logToday": "Log today",
    "nav.reviews": "Reviews",
    "nav.more": "More",
    "nav.settings": "Settings",
    "nav.primary": "Main navigation",
    "nav.close": "Close menu",
    "common.minutes": "minutes / day",
    "common.next": "What happens next",
    "common.progress": "Progress",
    "common.optional": "Optional",
    "common.saved": "Saved",
    "common.retry": "Try again",
    "common.points": "Virtual points",
    "status.todo": "To do",
    "status.in_progress": "In progress",
    "status.submitted": "Awaiting review",
    "status.approved": "Approved",
    "status.needs_changes": "Changes requested",
    "status.rejected": "Rejected",
    "status.disputed": "In dispute",
    "status.draft": "Draft",
    "status.active": "Active",
    "status.completed": "Completed",
    "status.cancelled": "Cancelled",
    "status.high": "High",
    "status.critical": "Critical",
    "status.medium": "Medium",
    "status.low": "Low",
    "status.met": "Met",
    "status.partially_met": "Partially met",
    "status.not_met": "Not met",
    "status.unclear": "Unclear",
    "status.open": "Open",
    "status.resolved": "Resolved",
    "dash.eyebrow": "Your workspace",
    "dash.title": "Your commitments",
    "dash.copy": "A clear next step. Work your team can verify.",
    "dash.new": "New sprint",
    "dash.current": "Current sprint",
    "dash.switch": "Switch sprint",
    "dash.day": "Day {day} of {total}",
    "dash.notStarted": "Starts {date}",
    "dash.ended": "Sprint ended · {date}",
    "dash.verified": "Verified completion",
    "dash.count": "{approved} of {total} tasks approved",
    "dash.noTasks": "No tasks to verify yet",
    "dash.elapsed": "Sprint time elapsed",
    "dash.pending": "Pending peer reviews",
    "dash.today": "Tasks due today",
    "dash.active": "Active sprints",
    "dash.points": "Your active commitment",
    "dash.pointsCopy": "Virtual points · no monetary value",
    "dash.focus": "Your next action",
    "dash.focusCopy": "Add proof to your work so a teammate can review it.",
    "dash.reviewAction": "Review a teammate’s submission",
    "dash.reviewCopy":
      "Compare the submitted evidence with the acceptance criteria.",
    "dash.openTask": "Open task",
    "dash.openReview": "Review evidence",
    "dash.logAction": "Record today’s progress",
    "dash.logCopy": "A brief update keeps your team moving together.",
    "dash.attention": "Your attention queue",
    "dash.attentionCopy":
      "Unfinished assigned tasks, ordered by deadline and priority.",
    "dash.due": "Due {date}",
    "dash.clear": "Your queue is clear",
    "dash.clearCopy":
      "Assigned work will appear here. You can still log progress or review a teammate’s proof.",
    "dash.reviewsEmpty": "No peer reviews waiting",
    "dash.reviewsEmptyCopy":
      "Only submissions by teammates appear here. You cannot review your own work.",
    "dash.activity": "Recent team evidence",
    "dash.activityEmpty": "No evidence submitted yet",
    "dash.activityCopy":
      "Attach proof to a task to start a reviewable record of your team’s work.",
    "dash.welcome": "Finish something together.",
    "dash.welcomeCopy":
      "Create or join a team, define a 7–14 day sprint, then build a habit of daily proof and peer review.",
    "dash.teamCta": "Create or join a team",
    "dash.noActive": "Ready for your next sprint?",
    "dash.noActiveCopy":
      "Review a draft or start a new sprint. Completed work is kept in your sprint history.",
    "dash.history": "Other sprints",
    "dash.noSprints": "No sprints yet",
    "dash.loadError":
      "Some workspace data could not be loaded. Refresh to try again; missing data is not counted as zero.",
    "dash.deadlines": "Deadline check",
    "dash.deadlineCopy":
      "{count} assigned tasks are overdue or due within two days. Based on due dates and task status; this is not an AI assessment.",
    "dash.reviewOwn": "Your submission is waiting for a teammate’s review.",
    "log.title": "Daily progress",
    "log.copy": "Two minutes to record what changed and link your proof.",
    "log.intro": "A little progress, made visible.",
    "log.introCopy":
      "Choose your sprint, share a short update, and add a proof link if you have one.",
    "log.project": "Sprint",
    "log.summary": "What changed today?",
    "log.summaryHint": "A sentence or two is enough.",
    "log.summaryPlaceholder":
      "Finished the signup flow and tested it on mobile.",
    "log.tasks": "Related tasks",
    "log.tasksHint":
      "Optional unless you add a proof link. Choose the work this update supports.",
    "log.link": "Proof link",
    "log.linkHint": "Select a task to attach this link as official evidence.",
    "log.evidence": "Need to upload a file?",
    "log.evidenceCopy":
      "Files belong on the task’s evidence screen, where access stays private. Saving a daily log does not submit the task for review.",
    "log.upload": "Open task evidence",
    "log.noTasks": "No open tasks assigned to you",
    "log.noTasksCopy":
      "You can still save an update. Open the sprint to see the plan and review states.",
    "log.more": "Add details (optional)",
    "log.date": "Date",
    "log.time": "Time spent (minutes)",
    "log.blockers": "Anything blocking you?",
    "log.next": "Tomorrow’s next step",
    "log.submit": "Save daily progress",
    "log.pending": "Saving progress…",
    "log.saved": "Progress saved",
    "log.savedCopy":
      "Your update is saved. Any proof link was attached to the tasks you selected. Submit a task separately when it is ready for review.",
    "log.view": "View sprint",
    "log.newUpdate": "Write another update",
    "log.empty": "No active sprint yet",
    "log.emptyCopy":
      "Daily check-ins become available after the team reviews a plan and starts the sprint.",
    "log.validation":
      "Choose an active sprint, enter a progress update, and check the optional fields.",
    "log.linkError":
      "Use a full http:// or https:// proof link and select at least one task.",
    "log.taskError":
      "Selected tasks must belong to this sprint and be assigned to you.",
    "log.saveError":
      "Your update could not be saved. Your input is still here; please try again.",
    "log.partialError":
      "Your update was saved, but related tasks or evidence could not be saved. Your input is still here. Check the task before retrying to avoid duplicate proof.",
    "wizard.moreTypes": "Show more project types",
    "wizard.fewerTypes": "Show fewer project types",
    "wizard.example": "Illustrative plan example",
    "wizard.exampleCopy":
      "These are sample tasks, not a generated plan. After creating the draft, the owner generates a plan using the sprint goal, success criteria, member skills and availability, then reviews it before starting.",
    "wizard.details": "More member preferences (optional)",
    "wizard.criteriaExample":
      "Example: Publish the signup page, save a test signup in the database, and share a working demo link by the deadline.",
    "wizard.basicsError":
      "Add a project name, description and measurable goal before continuing.",
    "wizard.datesError":
      "Choose valid dates with the finish on or after the start.",
    "wizard.reviewBasics": "Sprint at a glance",
    "wizard.edit": "Edit this step",
    "wizard.creating": "Creating draft…",
    "wizard.stepHelp0": "Name one outcome your team can finish.",
    "wizard.stepHelp1": "Choose observable results a teammate can verify.",
    "wizard.stepHelp2": "Set a realistic, time-boxed finish line.",
    "wizard.stepHelp3": "Start with each person’s role and daily availability.",
    "wizard.stepHelp4":
      "Points are a shared commitment with no monetary value.",
    "wizard.stepHelp5":
      "See how a plan is structured before generating your own.",
    "wizard.stepHelp6":
      "Check the commitment together before creating the draft.",
    "landing.preview": "Illustrative product preview · sample data",
    "landing.previewTitle": "Launch a working waitlist",
    "landing.previewGoal":
      "One clear outcome. Three tasks. Proof your team can review.",
    "landing.previewTask0": "Publish the landing page",
    "landing.previewTask1": "Test signup and data storage",
    "landing.previewTask2": "Record the final walkthrough",
    "landing.previewEvidence": "Expected: working link and screenshot",
    "landing.previewInsight": "Example recommendation",
    "landing.previewInsightCopy":
      "Ask a teammate to review the signup evidence before the sprint ends.",
    "landing.previewReason":
      "One sample task is awaiting review. This is illustrative content, not a live AI analysis.",
    "landing.noMoney":
      "Commitment points are virtual and have no monetary value.",
    "landing.audience": "For teams of 2–5 · 7–14 day sprints",
    "landing.walkthrough": "See how it works",
    "project.deadlineCopy":
      "Due dates are a calendar check. Only peer-approved tasks count toward verified completion.",
    "project.dueDate": "Sprint deadline:",
    "ai.taskTitle": "About AI assistance",
    "ai.taskCopy":
      "No automated evidence verdict is available here. A teammate checks the proof against the criteria. AI may help with a dispute or the final report.",
    "ai.planLimitations":
      "The plan uses your project goal, success criteria, selected members, skills and availability. It is a draft recommendation; your team reviews the tasks and starts the sprint.",
    "ai.disputeLimitations":
      "The mediator receives the task title, performer explanation, reviewer rejection reason and evidence count. It does not inspect evidence descriptions, links or file contents. The project owner decides the resolution.",
    "ai.title": "AI recommendation",
    "ai.limitations":
      "Recommendations use the recorded project goal, tasks, evidence descriptions and metadata, daily logs, reviews and disputes when supplied. Attached file contents and external links are not inspected. People verify the evidence and make the final decision.",
    "ai.confidence": "Reported confidence",
    "ai.missing": "Missing information",
    "ai.notReviewed": "Not yet verified",
    "ai.mock": "Illustrative output from the mock provider",
    "ai.mockCopy":
      "This report uses deterministic sample logic rather than a live AI model. Review all claims against the actual evidence.",
    "review.note": "Review reason",
    "review.noteHint": "A reason is required for changes or rejection.",
    "review.approve": "Approve work",
    "review.changes": "Request changes",
    "review.reasonRequired":
      "Explain what needs to change before submitting your review.",
    "review.decision": "Your review decision",
    "review.confirm": "I checked the evidence against the acceptance criteria.",
    "review.satisfied":
      "Criteria are not automatically checked off. Review the proof for each one.",
    "review.responsibility":
      "A teammate other than the assignee must review this work.",
    "review.reject": "Reject proof…",
    "review.rejectConfirm": "Confirm rejection",
    "review.rejectCopy":
      "Explain what the proof does not demonstrate. The assignee can respond or open a dispute.",
    "review.cancel": "Cancel",
    "review.pending": "Saving review…",
    "review.error":
      "Could not save the review. Check your connection and try again.",
    "evidence.GitHub commit": "GitHub commit",
    "evidence.screenshot": "Screenshot",
    "evidence.demo link": "Demo link",
    "evidence.Figma link": "Figma link",
    "evidence.document": "Document",
    "evidence.short video": "Short video",
  },
  lt: {
    "Proof and review data could not be loaded. No evidence state has been inferred.": "Nepavyko įkelti įrodymų ir peržiūros duomenų. Įrodymų būsena nenustatyta.",
    "Retry": "Bandyti dar kartą",
    "THE PROMISE": "PAŽADAS",
    "THE PROOF": "ĮRODYMAI",
    "Uploaded by": "Įkėlė",
    "Uploaded artifact. Source and authorship have not been independently verified.": "Įkeltas rezultatas. Šaltinis ir autorystė nepriklausomai nepatikrinti.",
    "project.planSize":
      "Juodraštyje yra {count} užduočių {days} dienų sprintui. Prieš pradėdami apsvarstykite galimybę sumažinti apimtį.",
    "project.proofExpectations":
      "Kiekvienai užduočiai reikia įrodymų, kuriuos komandos narys gali atidaryti ir palyginti su priėmimo kriterijais.",
    "task.help.todo":
      "Vykdytojas gali pradėti užduotį ir pridėti priėmimo kriterijus pagrindžiančių įrodymų.",
    "task.help.in_progress":
      "Darbas vykdomas. Pridėkite patikrinamų įrodymų ir pateikite užduotį komandos peržiūrai.",
    "task.help.submitted":
      "Įrodymai laukia komandos nario peržiūros. Vykdytojas negali patvirtinti savo darbo.",
    "task.help.needs_changes":
      "Perskaitykite vertintojo priežastį, patobulinkite įrodymus ir pateikite iš naujo.",
    "task.help.rejected":
      "Įrodymai atmesti. Perskaitykite priežastį, patobulinkite darbą arba pradėkite ginčą su paaiškinimu.",
    "task.help.disputed":
      "Prieš patvirtindamas sprendimą projekto savininkas peržiūri įrodymus ir AI rekomendaciją.",
    "task.help.approved":
      "Komandos narys patvirtino darbą. Jis įskaičiuojamas į patvirtintą projekto pažangą.",
    "nav.skip": "Pereiti prie turinio",
    "nav.sprints": "Sprintai",
    "nav.logToday": "Žymėti eigą",
    "nav.reviews": "Peržiūros",
    "nav.more": "Daugiau",
    "nav.settings": "Nustatymai",
    "nav.primary": "Pagrindinė navigacija",
    "nav.close": "Uždaryti meniu",
    "common.minutes": "min. per dieną",
    "common.next": "Kitas žingsnis",
    "common.progress": "Pažanga",
    "common.optional": "Nebūtina",
    "common.saved": "Išsaugota",
    "common.retry": "Bandyti dar kartą",
    "common.points": "Virtualūs taškai",
    "status.todo": "Reikia atlikti",
    "status.in_progress": "Vykdoma",
    "status.submitted": "Laukia peržiūros",
    "status.approved": "Patvirtinta",
    "status.needs_changes": "Prašoma pakeitimų",
    "status.rejected": "Atmesta",
    "status.disputed": "Ginčijama",
    "status.draft": "Juodraštis",
    "status.active": "Aktyvus",
    "status.completed": "Užbaigtas",
    "status.cancelled": "Atšauktas",
    "status.high": "Aukštas",
    "status.critical": "Kritinis",
    "status.medium": "Vidutinis",
    "status.low": "Žemas",
    "status.met": "Pasiekta",
    "status.partially_met": "Iš dalies pasiekta",
    "status.not_met": "Nepasiekta",
    "status.unclear": "Neaišku",
    "status.open": "Atviras",
    "status.resolved": "Išspręstas",
    "dash.eyebrow": "Jūsų darbo erdvė",
    "dash.title": "Jūsų įsipareigojimai",
    "dash.copy": "Aiškus kitas žingsnis. Darbas, kurį komanda gali patikrinti.",
    "dash.new": "Naujas sprintas",
    "dash.current": "Dabartinis sprintas",
    "dash.switch": "Keisti sprintą",
    "dash.day": "{day} diena iš {total}",
    "dash.notStarted": "Pradžia: {date}",
    "dash.ended": "Sprintas baigėsi · {date}",
    "dash.verified": "Patvirtinta pažanga",
    "dash.count": "Patvirtinta {approved} iš {total} užduočių",
    "dash.noTasks": "Dar nėra užduočių pažangai vertinti",
    "dash.elapsed": "Praėjęs sprinto laikas",
    "dash.pending": "Laukia komandos peržiūros",
    "dash.today": "Šiandienos termino užduotys",
    "dash.active": "Aktyvūs sprintai",
    "dash.points": "Jūsų aktyvus įsipareigojimas",
    "dash.pointsCopy": "Virtualūs taškai · neturi piniginės vertės",
    "dash.focus": "Jūsų kitas veiksmas",
    "dash.focusCopy":
      "Pridėkite darbo įrodymus, kad komandos narys galėtų juos peržiūrėti.",
    "dash.reviewAction": "Peržiūrėkite komandos nario darbą",
    "dash.reviewCopy":
      "Palyginkite pateiktus įrodymus su priėmimo kriterijais.",
    "dash.openTask": "Atidaryti užduotį",
    "dash.openReview": "Peržiūrėti įrodymus",
    "dash.logAction": "Pažymėkite šiandienos pažangą",
    "dash.logCopy": "Trumpas atnaujinimas padeda komandai judėti kartu.",
    "dash.attention": "Jūsų dėmesio laukiančios užduotys",
    "dash.attentionCopy":
      "Neužbaigtos priskirtos užduotys pagal terminą ir svarbą.",
    "dash.due": "Terminas: {date}",
    "dash.clear": "Laukiančių užduočių nėra",
    "dash.clearCopy":
      "Čia matysite priskirtus darbus. Galite pažymėti pažangą ar peržiūrėti komandos nario įrodymus.",
    "dash.reviewsEmpty": "Laukiančių peržiūrų nėra",
    "dash.reviewsEmptyCopy":
      "Čia rodomi tik komandos narių pateikti darbai. Savo darbo patvirtinti negalite.",
    "dash.activity": "Naujausi komandos įrodymai",
    "dash.activityEmpty": "Įrodymų dar nepateikta",
    "dash.activityCopy":
      "Pridėkite įrodymų prie užduoties ir pradėkite patikrinamą komandos darbo istoriją.",
    "dash.welcome": "Užbaikite ką nors kartu.",
    "dash.welcomeCopy":
      "Sukurkite komandą arba prisijunkite prie esamos, apibrėžkite 7–14 dienų sprintą ir kasdien dalykitės pažanga bei peržiūrėkite darbus.",
    "dash.teamCta": "Sukurti komandą arba prisijungti",
    "dash.noActive": "Pasiruošę kitam sprintui?",
    "dash.noActiveCopy":
      "Peržiūrėkite juodraštį arba pradėkite naują sprintą. Užbaigti darbai išlieka sprintų istorijoje.",
    "dash.history": "Kiti sprintai",
    "dash.noSprints": "Sprintų dar nėra",
    "dash.loadError":
      "Dalies duomenų įkelti nepavyko. Atnaujinkite puslapį; trūkstami duomenys nelaikomi nuliu.",
    "dash.deadlines": "Terminų patikra",
    "dash.deadlineCopy":
      "{count} priskirtų užduočių terminas praėjo arba baigsis per dvi dienas. Tai terminų ir būsenų patikra, o ne AI vertinimas.",
    "dash.reviewOwn": "Jūsų pateiktas darbas laukia komandos nario peržiūros.",
    "log.title": "Dienos pažanga",
    "log.copy":
      "Per dvi minutes pažymėkite pokyčius ir pridėkite įrodymų nuorodą.",
    "log.intro": "Maža pažanga tampa matoma.",
    "log.introCopy":
      "Pasirinkite sprintą, trumpai aprašykite pažangą ir, jei turite, pridėkite įrodymų nuorodą.",
    "log.project": "Sprintas",
    "log.summary": "Kas šiandien pasikeitė?",
    "log.summaryHint": "Pakanka vieno ar dviejų sakinių.",
    "log.summaryPlaceholder":
      "Užbaigiau registracijos procesą ir išbandžiau telefone.",
    "log.tasks": "Susijusios užduotys",
    "log.tasksHint":
      "Nebūtina, nebent pridedate įrodymų nuorodą. Pasirinkite darbus, kuriuos šis įrašas pagrindžia.",
    "log.link": "Įrodymų nuoroda",
    "log.linkHint":
      "Pasirinkite užduotį, kad ši nuoroda būtų pridėta kaip jos įrodymas.",
    "log.evidence": "Norite įkelti failą?",
    "log.evidenceCopy":
      "Failai įkeliami užduoties įrodymų lange, kuriame prieiga lieka privati. Dienos įrašas nepateikia užduoties peržiūrai.",
    "log.upload": "Atidaryti užduoties įrodymus",
    "log.noTasks": "Jums nepriskirta atvirų užduočių",
    "log.noTasksCopy":
      "Vis tiek galite išsaugoti pažangos įrašą. Sprinto lange rasite planą ir peržiūrų būsenas.",
    "log.more": "Pridėti daugiau informacijos (nebūtina)",
    "log.date": "Data",
    "log.time": "Skirtas laikas (minutėmis)",
    "log.blockers": "Ar kas nors trukdo?",
    "log.next": "Rytdienos žingsnis",
    "log.submit": "Išsaugoti dienos pažangą",
    "log.pending": "Pažanga saugoma…",
    "log.saved": "Pažanga išsaugota",
    "log.savedCopy":
      "Įrašas išsaugotas. Įrodymų nuoroda pridėta prie pasirinktų užduočių. Paruoštą užduotį pateikite peržiūrai atskirai.",
    "log.view": "Peržiūrėti sprintą",
    "log.newUpdate": "Rašyti kitą įrašą",
    "log.empty": "Aktyvaus sprinto dar nėra",
    "log.emptyCopy":
      "Dienos įrašai bus pasiekiami komandai peržiūrėjus planą ir pradėjus sprintą.",
    "log.validation":
      "Pasirinkite aktyvų sprintą, aprašykite pažangą ir patikrinkite papildomus laukus.",
    "log.linkError":
      "Įveskite pilną http:// arba https:// įrodymų nuorodą ir pasirinkite bent vieną užduotį.",
    "log.taskError":
      "Pasirinktos užduotys turi priklausyti šiam sprintui ir būti priskirtos jums.",
    "log.saveError":
      "Įrašo išsaugoti nepavyko. Jūsų tekstas liko formoje; bandykite dar kartą.",
    "log.partialError":
      "Įrašas išsaugotas, bet susijusių užduočių ar įrodymų išsaugoti nepavyko. Jūsų tekstas liko formoje. Prieš kartodami patikrinkite užduotį, kad įrodymai nesidubliuotų.",
    "wizard.moreTypes": "Rodyti daugiau projektų tipų",
    "wizard.fewerTypes": "Rodyti mažiau projektų tipų",
    "wizard.example": "Iliustracinis plano pavyzdys",
    "wizard.exampleCopy":
      "Tai pavyzdinės užduotys, o ne sugeneruotas planas. Sukūręs juodraštį savininkas generuoja planą pagal tikslą, sėkmės kriterijus, narių įgūdžius ir užimtumą, tada jį peržiūri prieš pradėdamas.",
    "wizard.details": "Daugiau nario pageidavimų (nebūtina)",
    "wizard.criteriaExample":
      "Pavyzdys: iki termino paskelbti registracijos puslapį, išsaugoti bandomąją registraciją duomenų bazėje ir pasidalyti veikiančia demonstracijos nuoroda.",
    "wizard.basicsError":
      "Prieš tęsdami įrašykite projekto pavadinimą, aprašymą ir pamatuojamą tikslą.",
    "wizard.datesError":
      "Pasirinkite galiojančias datas; pabaiga negali būti ankstesnė už pradžią.",
    "wizard.reviewBasics": "Sprinto apžvalga",
    "wizard.edit": "Redaguoti šį žingsnį",
    "wizard.creating": "Kuriamas juodraštis…",
    "wizard.stepHelp0":
      "Įvardykite vieną rezultatą, kurį komanda gali užbaigti.",
    "wizard.stepHelp1":
      "Pasirinkite rezultatus, kuriuos komandos narys gali patikrinti.",
    "wizard.stepHelp2": "Nustatykite realistišką ir aiškų terminą.",
    "wizard.stepHelp3":
      "Pradėkite nuo kiekvieno nario vaidmens ir dienos užimtumo.",
    "wizard.stepHelp4":
      "Taškai žymi bendrą įsipareigojimą ir neturi piniginės vertės.",
    "wizard.stepHelp5":
      "Susipažinkite su plano struktūra prieš generuodami savąjį.",
    "wizard.stepHelp6":
      "Prieš kurdami juodraštį kartu patikrinkite įsipareigojimą.",
    "landing.preview": "Iliustracinė produkto peržiūra · pavyzdiniai duomenys",
    "landing.previewTitle": "Paleisti veikiantį laukiančiųjų sąrašą",
    "landing.previewGoal":
      "Vienas aiškus tikslas. Trys užduotys. Patikrinami įrodymai komandai.",
    "landing.previewTask0": "Paskelbti pristatymo puslapį",
    "landing.previewTask1": "Išbandyti registraciją ir duomenų saugojimą",
    "landing.previewTask2": "Įrašyti galutinę demonstraciją",
    "landing.previewEvidence": "Tikimasi: veikianti nuoroda ir ekrano kopija",
    "landing.previewInsight": "Rekomendacijos pavyzdys",
    "landing.previewInsightCopy":
      "Paprašykite komandos nario peržiūrėti registracijos įrodymus iki sprinto pabaigos.",
    "landing.previewReason":
      "Viena pavyzdinė užduotis laukia peržiūros. Tai iliustracija, o ne gyva AI analizė.",
    "landing.noMoney":
      "Įsipareigojimo taškai yra virtualūs ir neturi piniginės vertės.",
    "landing.audience": "2–5 žmonių komandoms · 7–14 dienų sprintai",
    "landing.walkthrough": "Kaip tai veikia",
    "project.deadlineCopy":
      "Terminas yra kalendorinė patikra. Patvirtintą pažangą sudaro tik komandos patvirtintos užduotys.",
    "project.dueDate": "Sprinto terminas:",
    "ai.taskTitle": "Apie AI pagalbą",
    "ai.taskCopy":
      "Šiame lange automatinis įrodymų vertinimas neatliekamas. Komandos narys palygina įrodymus su kriterijais. AI gali padėti spręsti ginčą arba rengti galutinę ataskaitą.",
    "ai.planLimitations":
      "Planas remiasi projekto tikslu, sėkmės kriterijais, pasirinktais nariais, įgūdžiais ir užimtumu. Tai rekomendacinis juodraštis; komanda peržiūri užduotis ir pradeda sprintą.",
    "ai.disputeLimitations":
      "Tarpininkas gauna užduoties pavadinimą, vykdytojo paaiškinimą, atmetimo priežastį ir įrodymų skaičių. Jis netikrina įrodymų aprašymų, nuorodų ar failų turinio. Sprendimą priima projekto savininkas.",
    "ai.title": "AI rekomendacija",
    "ai.limitations":
      "Rekomendacijoms naudojami pateikti projekto tikslai, užduotys, įrodymų aprašymai ir metaduomenys, dienos įrašai, peržiūros bei ginčai. Pridėtų failų turinys ir išorinės nuorodos nėra tikrinami. Žmonės patikrina įrodymus ir priima galutinį sprendimą.",
    "ai.confidence": "Nurodytas pasitikėjimas",
    "ai.missing": "Trūkstama informacija",
    "ai.notReviewed": "Dar nepatikrinta",
    "ai.mock": "Pavyzdinė imitacinio teikėjo išvestis",
    "ai.mockCopy":
      "Šioje ataskaitoje naudojama deterministinė pavyzdinė logika, o ne gyvas AI modelis. Palyginkite visus teiginius su tikrais įrodymais.",
    "review.note": "Peržiūros priežastis",
    "review.noteHint": "Prašant pakeitimų ar atmetant būtina priežastis.",
    "review.approve": "Patvirtinti darbą",
    "review.changes": "Prašyti pakeitimų",
    "review.reasonRequired":
      "Prieš pateikdami peržiūrą paaiškinkite, ką reikia pakeisti.",
    "review.decision": "Jūsų peržiūros sprendimas",
    "review.confirm": "Palyginau įrodymus su priėmimo kriterijais.",
    "review.satisfied":
      "Kriterijai nepažymimi automatiškai. Patikrinkite kiekvieną pagal įrodymus.",
    "review.responsibility":
      "Darbą turi peržiūrėti kitas komandos narys, ne užduoties vykdytojas.",
    "review.reject": "Atmesti įrodymus…",
    "review.rejectConfirm": "Patvirtinti atmetimą",
    "review.rejectCopy":
      "Paaiškinkite, ko įrodymai nepatvirtina. Vykdytojas galės atsakyti arba pradėti ginčą.",
    "review.cancel": "Atšaukti",
    "review.pending": "Peržiūra saugoma…",
    "review.error":
      "Peržiūros išsaugoti nepavyko. Patikrinkite ryšį ir bandykite dar kartą.",
    "evidence.GitHub commit": "GitHub pakeitimas",
    "evidence.screenshot": "Ekrano kopija",
    "evidence.demo link": "Demonstracijos nuoroda",
    "evidence.Figma link": "Figma nuoroda",
    "evidence.document": "Dokumentas",
    "evidence.short video": "Trumpas vaizdo įrašas",
  },
} as const;
