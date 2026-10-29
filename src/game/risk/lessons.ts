export type LessonOption = {
  label: string;
  correct: boolean;
  feedback: string;
};

export type Lesson = {
  id: string;
  title: string;
  prompt: string;
  options: LessonOption[];
};

export const LESSONS: Lesson[] = [
  {
    id: "inventory",
    title: "Know what you have",
    prompt: "A new customer portal is nearly ready. What should the team map before choosing safeguards?",
    options: [
      { label: "The portal, information it handles, accounts, devices and supplier dependencies", correct: true, feedback: "A reliable inventory shows what needs protection and which other services the portal depends on." },
      { label: "A security product to buy before checking which systems the portal uses", correct: false, feedback: "A tool may help later, but without an inventory it is easy to miss an important system or dependency." },
    ],
  },
  {
    id: "exposure",
    title: "Reduce internet exposure",
    prompt: "The public portal and its administration console can both be reached from the internet. What should the team change?",
    options: [
      { label: "Keep the customer portal public and restrict the administration console to trusted access", correct: true, feedback: "Only services that need public access should be exposed. Keep management interfaces on trusted access paths." },
      { label: "Leave both available and rely on people not finding the console", correct: false, feedback: "An unneeded public interface stays discoverable and gives attackers another route in." },
    ],
  },
  {
    id: "priority",
    title: "Prioritise an urgent weakness",
    prompt: "A known exploited vulnerability affects the exposed portal server. Which response should come first?",
    options: [
      { label: "Confirm the impact, then apply a tested fix or suitable mitigation promptly", correct: true, feedback: "Known exploitation, internet exposure and service impact are strong reasons to act promptly." },
      { label: "Treat it like every other update and wait for the next routine cycle", correct: false, feedback: "An actively exploited weakness on an exposed service needs prompt assessment." },
    ],
  },
  {
    id: "accounts",
    title: "Protect important accounts",
    prompt: "Several administrators share one password. What is a more resilient approach?",
    options: [
      { label: "Use named administrator accounts and require multi-factor authentication", correct: true, feedback: "Named accounts improve accountability. Multi-factor authentication adds protection if a password is stolen." },
      { label: "Keep sharing the password but change it more often", correct: false, feedback: "A shared password makes it harder to attribute actions and can still be stolen or reused." },
    ],
  },
  {
    id: "recovery",
    title: "Practise recovery",
    prompt: "The only backup drive is connected to the same network as the server. What should the team do?",
    options: [
      { label: "Protect a separate backup copy and practise restoring important information", correct: true, feedback: "Backups help when copies survive an incident and the organisation knows how to restore from them." },
      { label: "Assume the connected drive will always be available during an incident", correct: false, feedback: "Malware or a compromised account may reach connected copies. Protect separate copies and test restoration." },
    ],
  },
];
