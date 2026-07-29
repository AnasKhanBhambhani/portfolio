import { Code, CodeHeader, CodeBlock } from "./ui/animate-code";
import { IconCode } from "./icons";

const PROFILE_CODE = `const profile = {
  name: 'Muhammad Anas',
  title: 'Frontend-Focused Full-Stack Developer',
  skills: [
    'React', 'Next.js', 'TypeScript', 'Node.js',
    'Express', 'MongoDB', 'PostgreSQL', 'Tailwind',
    'Docker', 'AWS', 'Git', 'REST APIs'
  ],
  hardWorker: true,
  quickLearner: true,
  problemSolver: true,
  yearsOfExperience: 5,
  hireable: function() {
    return (
      this.hardWorker &&
      this.problemSolver &&
      this.skills.length >= 5 &&
      this.yearsOfExperience >= 3
    );
  }
};`;

export default function HeroCode() {
  return (
    <Code code={PROFILE_CODE} className="w-full max-w-115">
      <CodeHeader icon={IconCode} copyButton>
        profile.js
      </CodeHeader>
      <CodeBlock lang="js" writing={false} />
    </Code>
  );
}
