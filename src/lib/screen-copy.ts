// Legacy screen copy stays in the existing translator while those server-rendered
// screens adopt live EN/LT selection. User-authored content is never translated.
const lt: Record<string, string> = {
  "Check your email to confirm your account.":
    "Patvirtinkite paskyrą paspaudę el. paštu gautą nuorodą.",
  "Email confirmed. You can now log in.":
    "El. paštas patvirtintas. Dabar galite prisijungti.",
  "AI plan saved.": "AI planas išsaugotas.",
  "AI-planned tasks will start here.": "Čia atsiras suplanuotos užduotys.",
  "Work appears here once someone starts.": "Pradėti darbai rodomi čia.",
  "Proof waiting for peer review lands here.":
    "Čia rodomi įrodymai, laukiantys komandos peržiūros.",
  "Approved proof counts toward progress.":
    "Patvirtinti darbai įskaičiuojami į pažangą.",
  "Tasks needing clearer proof show here.":
    "Čia matysite užduotis, kurioms reikia aiškesnių įrodymų.",
  "Only unsupported proof should land here.": "Čia rodomi atmesti darbai.",
  "AI can structure disagreements here.": "AI gali padėti išanalizuoti ginčus.",
  "Back to project": "Grįžti į projektą",
  "Back to dashboard": "Grįžti į apžvalgą",
  "Back to task": "Grįžti į užduotį",
  "AI final report": "Galutinė AI ataskaita",
  "AI plan draft": "AI plano juodraštis",
  "AI recommendation": "AI rekomendacija",
  "AI risk note": "AI rizikos pastaba",
  "AI suggested": "AI pasiūlė",
  "Acceptance criteria": "Priėmimo kriterijai",
  "Add proof of work": "Pridėti darbo įrodymų",
  "Approve task": "Patvirtinti užduotį",
  Approved: "Patvirtinta",
  "Approved assigned tasks": "Patvirtintos priskirtos užduotys",
  "Approved progress": "Patvirtinta pažanga",
  "Arguments for approval": "Argumentai už patvirtinimą",
  "Arguments for rejection": "Argumentai už atmetimą",
  "Ask AI to structure the dispute": "Prašyti AI išanalizuoti ginčą",
  Assignee: "Vykdytojas",
  Confidence: "Nurodytas pasitikėjimas",
  "Confirm final outcome": "Patvirtinti galutinį rezultatą",
  "Confirm human resolution": "Patvirtinti žmogaus sprendimą",
  "Daily log": "Dienos įrašas",
  "Days remaining": "Likę dienų",
  "Deadline check": "Terminų patikra",
  "Delay analysis:": "Vėlavimų analizė:",
  "Delay and dispute analysis": "Vėlavimų ir ginčų analizė",
  Deliverable: "Rezultatas",
  "Dispute resolution": "Ginčo sprendimas",
  "Dispute summary:": "Ginčų santrauka:",
  Disputed: "Ginčijama",
  Due: "Terminas",
  "Edit plan before starting": "Redaguoti planą prieš pradžią",
  "Edit plan first": "Pirmiausia redaguoti planą",
  "Evidence (": "Įrodymai (",
  "Evidence is the source of truth": "Įrodymai pagrindžia pažangą",
  "Evidence quality": "Įrodymų kokybė",
  "Expected evidence": "Tikėtini įrodymai",
  "Final project report": "Galutinė projekto ataskaita",
  "Final report": "Galutinė ataskaita",
  "Generate AI plan": "Generuoti AI planą",
  "Regenerate AI plan": "Generuoti AI planą iš naujo",
  "Generate final report": "Generuoti galutinę ataskaitą",
  "How disputes work": "Kaip sprendžiami ginčai",
  "Human confirmation required": "Reikalingas žmogaus patvirtinimas",
  "Human decision confirmed": "Žmogaus sprendimas patvirtintas",
  "Log today": "Pažymėti dienos eigą",
  "Mark in progress": "Pradėti vykdyti",
  "Member contribution scores": "AI narių indėlio vertinimai",
  "No daily logs yet": "Dienos įrašų dar nėra",
  "No final report yet": "Galutinės ataskaitos dar nėra",
  "No pending approvals": "Laukiančių patvirtinimų nėra",
  "No proof of work yet": "Darbo įrodymų dar nėra",
  "No tasks yet": "Užduočių dar nėra",
  "Nothing to review yet": "Kol kas nėra ko peržiūrėti",
  "Open a dispute": "Pradėti ginčą",
  "Open board": "Atidaryti užduotis",
  "Open detail": "Atidaryti užduotį",
  "Open evidence": "Atidaryti įrodymą",
  "Open issues:": "Neišspręstos problemos:",
  "Peer approval": "Komandos patvirtinimas",
  "Peer review": "Komandos peržiūra",
  "Performed by": "Atliko",
  "Performer explanation": "Vykdytojo paaiškinimas",
  Phase: "Etapas",
  "Planned tasks": "Suplanuotos užduotys",
  Priority: "Svarba",
  "Proof file (optional, max 10 MB)": "Įrodymo failas (nebūtina, iki 10 MB)",
  "Proof link (optional)": "Įrodymo nuoroda (nebūtina)",
  "Proof type": "Įrodymo tipas",
  "Ready to close the sprint?": "Pasiruošę užbaigti sprintą?",
  Reason: "Priežastis",
  "Recent daily logs": "Naujausi dienos įrašai",
  "Reject proof": "Atmesti įrodymą",
  "Request changes": "Prašyti pakeitimų",
  Return: "Grąžinti",
  "Review history": "Peržiūrų istorija",
  "Review queue": "Peržiūrų eilė",
  "Review submitted evidence": "Peržiūrėti pateiktus įrodymus",
  "Reviewer guide": "Peržiūros gairės",
  "Reviewer reason": "Vertintojo priežastis",
  "Reviews and disputes": "Peržiūros ir ginčai",
  "Save task": "Išsaugoti užduotį",
  "Start project with this plan": "Pradėti projektą pagal šį planą",
  "Start when the draft feels fair": "Pradėkite, kai planas visiems priimtinas",
  "Strongest evidence:": "Stipriausi įrodymai:",
  "Submit evidence": "Pridėti įrodymų",
  "Submit for review": "Pateikti peržiūrai",
  "Submitted evidence": "Pateikti įrodymai",
  "Success criteria evaluation": "Sėkmės kriterijų vertinimas",
  Task: "Užduotis",
  "Task board": "Užduočių lenta",
  "Tasks by status": "Užduotys pagal būseną",
  Team: "Komanda",
  View: "Peržiūrėti",
  "Virtual commitment points": "Virtualūs įsipareigojimo taškai",
  "Virtual pledges": "Virtualūs įsipareigojimai",
  "What does this prove?": "Ką tai įrodo?",
  "What happens after generation": "Kas vyks po generavimo",
  "What reviewers are checking": "Ką tikrina vertintojai",
  "Why AI thinks this:": "AI vertinimo pagrindimas:",
  "Why assigned": "Kodėl priskirta",
  "Why should this be reconsidered?": "Kodėl sprendimą reikėtų persvarstyti?",
  "Why this member:": "Kodėl šis narys:",
  "You are not locked into this plan": "Šį planą galima keisti",
  "Your explanation": "Jūsų paaiškinimas",
  "Your task": "Jūsų užduotis",
  "assigned tasks approved": "priskirtų užduočių patvirtinta",
  min: "min.",
  "% confidence": "% pasitikėjimas",
  "% pledge": "% įsipareigojimo",
  ": virtual pledge return percentage":
    ": grąžinama virtualaus įsipareigojimo dalis procentais",
  low: "Žema",
  medium: "Vidutinė",
  high: "Aukšta",
  critical: "Kritinė",
  screenshot: "Ekrano kopija",
  document: "Dokumentas",
  github: "GitHub",
  video: "Vaizdo įrašas",
  link: "Nuoroda",
  demo: "Demonstracija",
  other: "Kita",
  dispute: "ginčas",
  "AI helps organize the disagreement, identify missing proof, and suggest a resolution. It does not make the final decision and it never moves money.":
    "AI padeda išanalizuoti nesutarimą, nustatyti trūkstamus įrodymus ir pasiūlyti sprendimą. Jis nepriima galutinio sprendimo ir neperveda pinigų.",
  "AI structures the disagreement and recommends a next step. A human owner confirms the resolution.":
    "AI išanalizuoja nesutarimą ir rekomenduoja kitą žingsnį. Sprendimą patvirtina projekto savininkas.",
  "AI turns the commitment into editable tasks with owners, deadlines, acceptance criteria, expected evidence, and risk notes.":
    "AI parengia redaguojamas užduotis su vykdytojais, terminais, priėmimo kriterijais, įrodymų reikalavimais ir rizikos pastabomis.",
  "Add proof your reviewer can open and compare with the acceptance criteria.":
    "Pridėkite įrodymų, kuriuos vertintojas galėtų atidaryti ir palyginti su priėmimo kriterijais.",
  "Adjust owner, due date, and priority before starting the project. Acceptance criteria and proof expectations stay visible while you edit.":
    "Prieš pradėdami koreguokite vykdytojus, terminus ir svarbą. Redaguojant matomi priėmimo kriterijai ir įrodymų reikalavimai.",
  "Approve if the proof clearly matches the task.":
    "Patvirtinkite, jei įrodymai aiškiai pagrindžia užduotį.",
  "Approve if the proof clearly matches the task. Request changes if the work is started but not fully proven. Reject only if the evidence does not support the task.":
    "Patvirtinkite, jei įrodymai aiškiai pagrindžia užduotį. Prašykite pakeitimų, jei darbas pradėtas, bet nepakankamai įrodytas. Atmeskite tik jei įrodymai nepagrindžia užduoties.",
  "Attach a commit, screenshot, demo link, Figma link, document, or short video before submitting this task for review.":
    "Prieš pateikdami peržiūrai pridėkite GitHub pakeitimą, ekrano kopiją, demonstracijos ar Figma nuorodą, dokumentą arba trumpą vaizdo įrašą.",
  "Choose the final task status after reading the proof, reviewer reason, and AI recommendation.":
    "Susipažinę su įrodymais, vertintojo priežastimi ir AI rekomendacija pasirinkite galutinę užduoties būseną.",
  "Compare each claim against acceptance criteria. AI can advise later, but teammates approve the work first.":
    "Palyginkite kiekvieną teiginį su priėmimo kriterijais. AI gali patarti vėliau, tačiau darbą pirmiausia patvirtina komanda.",
  "Compare the evidence with every acceptance criterion. Your decision controls whether this task counts toward project progress.":
    "Palyginkite įrodymus su kiekvienu priėmimo kriterijumi. Jūsų sprendimas lemia, ar užduotis įskaičiuojama į projekto pažangą.",
  "Daily check-ins should take less than 2 minutes. They help the team see progress before review time.":
    "Dienos įrašas turėtų užtrukti iki 2 minučių. Jis leidžia komandai matyti pažangą dar prieš peržiūrą.",
  "Declared commitments only. CommitBet does not hold money.":
    "Tik deklaruoti virtualūs įsipareigojimai. CommitBet nelaiko pinigų.",
  "Disputes are not a fight button. AI helps structure the disagreement, then a human owner confirms the resolution.":
    "Ginčas padeda išsiaiškinti nesutarimą. AI parengia rekomendaciją, o projekto savininkas patvirtina sprendimą.",
  "Each criterion is evaluated against evidence and review outcomes.":
    "Kiekvienas kriterijus vertinamas pagal įrodymus ir peržiūrų rezultatus.",
  "Example: This demo link shows the new approval flow matching all three criteria.":
    "Pavyzdys: ši demonstracija parodo naują patvirtinimo procesą, atitinkantį visus tris kriterijus.",
  "Generate an evidence-based AI final report before confirming virtual pledge outcomes.":
    "Prieš patvirtindami virtualių įsipareigojimų rezultatą sugeneruokite įrašais pagrįstą AI ataskaitą.",
  "Generate or regenerate the AI plan to see phases and deliverables here.":
    "Sugeneruokite AI planą, kad čia matytumėte etapus ir rezultatus.",
  "Good proof is easy to open and directly supports the criteria above.":
    "Geras įrodymas lengvai atidaromas ir tiesiogiai pagrindžia aukščiau nurodytus kriterijus.",
  "Great. No teammate submissions are waiting right now.":
    "Šiuo metu nėra komandos pateiktų darbų, laukiančių peržiūros.",
  "Human confirmation is required before the sprint outcome is recorded.":
    "Prieš užfiksuojant sprinto rezultatą būtinas žmogaus patvirtinimas.",
  "Human confirmation is still required after AI recommends an outcome.":
    "AI pateikus rekomendaciją vis tiek būtinas žmogaus patvirtinimas.",
  "I understand this is my team’s manual virtual-pledge decision. No funds are transferred.":
    "Suprantu, kad tai mano komandos rankiniu būdu priimamas sprendimas dėl virtualaus įsipareigojimo. Pinigai nepervedami.",
  "Move this forward, attach proof, then submit it when a teammate can review it.":
    "Atlikite darbą, pridėkite įrodymų ir pateikite jį komandos nario peržiūrai.",
  "Move work from todo to approved through evidence submission and peer review.":
    "Pridėkite įrodymų ir pateikite komandos peržiūrai, kad užduotis būtų patvirtinta.",
  "Nice. When a teammate submits proof, it will appear here for a quick human review.":
    "Komandos nariui pateikus įrodymų, jie čia bus rodomi žmogaus peržiūrai.",
  "No criteria were added yet. Ask the project owner to clarify what approval should mean.":
    "Kriterijų dar nėra. Paprašykite savininko patikslinti, kada darbas laikomas atliktu.",
  "No evidence rows were found. Open detail before approving.":
    "Įrodymų įrašų nerasta. Prieš patvirtindami atidarykite užduotį.",
  "No reviews yet.": "Peržiūrų dar nėra.",
  "Once the owners, deadlines, and proof expectations look right, start the project with this plan.":
    "Kai vykdytojai, terminai ir įrodymų reikalavimai suderinti, pradėkite projektą pagal šį planą.",
  "Point to the proof and the criteria you believe it satisfies.":
    "Nurodykite įrodymus ir kriterijus, kuriuos jie, jūsų manymu, pagrindžia.",
  "Progress only becomes real when submitted evidence is reviewed.":
    "Pažanga patvirtinama tik peržiūrėjus pateiktus įrodymus.",
  "Proof is the source of truth for task progress. Reviewers should compare it to every criterion above.":
    "Įrodymai pagrindžia užduoties pažangą. Vertintojai turi juos palyginti su kiekvienu kriterijumi.",
  "Proof should show the work, not just describe it.":
    "Įrodymai turi parodyti darbą, o ne vien jį aprašyti.",
  "Recommendation only. Humans still confirm the task outcome and no financial or pledge action is automatic.":
    "Tai tik rekomendacija. Užduoties rezultatą patvirtina žmonės. Finansiniai ar įsipareigojimų sprendimai nevykdomi automatiškai.",
  "Recommendation unavailable.": "Rekomendacija nepasiekiama.",
  "Review the AI recommendation together, then confirm the final outcome manually. CommitBet does not collect or transfer money.":
    "Kartu peržiūrėkite AI rekomendaciją ir rankiniu būdu patvirtinkite galutinį rezultatą. CommitBet nerenka ir neperveda pinigų.",
  "Review the draft before starting. You can edit task names, owners, due dates, and priorities below. Keep evidence requirements concrete so reviewers know what to check.":
    "Prieš pradėdami peržiūrėkite juodraštį. Toliau galite keisti užduočių pavadinimus, vykdytojus, terminus ir svarbą. Aiškiai apibrėžkite įrodymus, kad vertintojai žinotų, ką tikrinti.",
  "Review the plan before starting. You can edit tasks, deadlines, and evidence requirements before the project becomes active.":
    "Prieš pradėdami peržiūrėkite planą. Juodraštyje galite koreguoti užduočių pagrindinius laukus; kriterijams keisti sugeneruokite naują planą.",
  "Tasks will appear after the owner generates an AI plan. The plan is editable before the project starts.":
    "Užduotys atsiras savininkui sugeneravus AI planą. Prieš pradžią planą galima redaguoti.",
  "The draft should be useful, but your team should still tune it before starting.":
    "Prieš pradėdami kartu peržiūrėkite ir pritaikykite juodraštį.",
  "The report appears after you generate an evidence audit. It evaluates success criteria, task statistics, member contribution, evidence quality, delay patterns, disputes, and virtual pledge recommendations.":
    "Sugeneravus ataskaitą čia bus pateiktas sėkmės kriterijų, užduočių, narių indėlio, įrodymų įrašų, vėlavimų, ginčų ir virtualių įsipareigojimų vertinimas.",
  "This is the checklist reviewers compare against the submitted proof.":
    "Vertintojai palygina šį sąrašą su pateiktais įrodymais.",
  "This manual action is the final recorded outcome. No funds were transferred.":
    "Šis žmogaus patvirtintas sprendimas yra galutinis užfiksuotas rezultatas. Pinigai nepervesti.",
  "Todo, in progress, submitted, approved, changes, rejected, and disputed work in one view.":
    "Vienoje vietoje matykite planuojamas, vykdomas, pateiktas, patvirtintas, keistinas, atmestas ir ginčijamas užduotis.",
  "Use task detail pages to attach proof and peer reviews before the final report.":
    "Prieš galutinę ataskaitą užduočių languose pridėkite įrodymų ir komandos peržiūrų.",
  "When proof arrives, compare it to the acceptance criteria before approving.":
    "Gavę įrodymų, prieš patvirtindami palyginkite juos su priėmimo kriterijais.",
  "Virtual points have no monetary value":
    "Virtualūs taškai neturi piniginės vertės",
  "Saving AI plan…": "AI planas saugomas…",
  "Review the draft AI plan": "Peržiūrėti AI plano juodraštį",
  "Generate your execution plan": "Sugeneruoti veiksmų planą",
  "Plan may be too large": "Planas gali būti per didelis",
  "Proof expectations": "Įrodymų reikalavimai",
  "Needs manual review": "Reikalinga žmogaus peržiūra",
  "Not completed": "Neužbaigta",
  Success: "Sėkmė",
  "Partial success": "Dalinė sėkmė",
  teammate: "komandos narys",
  "Dispute:": "Ginčas:",
  Unassigned: "Nepriskirta",
  "Evidence expected": "Laukiama įrodymų",
  "Acceptance criteria pending.": "Laukiama priėmimo kriterijų.",
  "human confirmation required": "Reikalingas žmogaus patvirtinimas",
  "Ask the owner to regenerate the draft with clear acceptance criteria.":
    "Paprašykite savininko sugeneruoti juodraštį su aiškiais priėmimo kriterijais.",
  "Proof requirement pending.": "Įrodymų reikalavimai dar nenustatyti.",
};
export const screenCopy = {
  en: Object.fromEntries(Object.keys(lt).map((key) => [key, key])),
  lt,
};
