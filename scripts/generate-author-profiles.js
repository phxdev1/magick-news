import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';
import { existsSync } from 'fs';

const AUTHORS = {
  male: [
    {
      name: "John Anderson",
      role: "AI Research Scientist",
      expertise: ["Deep Learning", "Computer Vision", "Neural Architecture Search"],
      location: "United States",
      languages: ["English", "Python", "PyTorch", "TensorFlow"]
    },
    {
      name: "Pierre Martin",
      role: "Deep Learning Engineer",
      expertise: ["Natural Language Processing", "Transformer Models", "Model Optimization"],
      location: "France",
      languages: ["French", "English", "Python", "PyTorch", "Hugging Face"]
    },
    {
      name: "Juan Garcia",
      role: "AI Ethics Researcher",
      expertise: ["AI Ethics", "Fairness in ML", "Responsible AI"],
      location: "Spain",
      languages: ["Spanish", "English", "Python", "R", "SQL"]
    },
    {
      name: "Raj Patel",
      role: "MLOps Engineer",
      expertise: ["MLOps", "Distributed Training", "Cloud Infrastructure"],
      location: "India",
      languages: ["Hindi", "English", "Python", "Go", "Kubernetes"]
    },
    {
      name: "Marco Rossi",
      role: "Robotics AI Researcher",
      expertise: ["Reinforcement Learning", "Robot Control", "Computer Vision"],
      location: "Italy",
      languages: ["Italian", "English", "Python", "C++", "ROS"]
    },
    {
      name: "Anders Nielsen",
      role: "NLP Research Lead",
      expertise: ["Large Language Models", "Few-shot Learning", "Multilingual NLP"],
      location: "Denmark",
      languages: ["Danish", "English", "Python", "PyTorch", "JAX"]
    },
    {
      name: "Ken Tanaka",
      role: "Computer Vision Scientist",
      expertise: ["3D Vision", "Deep Learning", "Visual SLAM"],
      location: "Japan",
      languages: ["Japanese", "English", "Python", "C++", "CUDA"]
    },
    {
      name: "Ahmed Hassan",
      role: "AI Security Researcher",
      expertise: ["Adversarial ML", "Model Security", "Privacy-Preserving ML"],
      location: "UAE",
      languages: ["Arabic", "English", "Python", "Julia", "TensorFlow"]
    },
    {
      name: "James Wilson",
      role: "ML Platform Lead",
      expertise: ["Distributed Systems", "ML Infrastructure", "Cloud Architecture"],
      location: "United Kingdom",
      languages: ["English", "Python", "Go", "Rust", "Kubernetes"]
    },
    {
      name: "Wei Chen",
      role: "ML Systems Architect",
      expertise: ["Distributed ML", "High-Performance Computing", "Model Serving"],
      location: "Singapore",
      languages: ["Chinese", "English", "Python", "C++", "CUDA"]
    }
  ],
  female: [
    {
      name: "Ana Rodriguez",
      role: "AI Research Lead",
      expertise: ["Reinforcement Learning", "Multi-agent Systems", "Game Theory"],
      location: "Spain",
      languages: ["Spanish", "English", "Python", "JAX", "PyTorch"]
    },
    {
      name: "Marie Bernard",
      role: "AI Ethics Director",
      expertise: ["AI Governance", "Algorithmic Fairness", "Policy"],
      location: "Canada",
      languages: ["French", "English", "Python", "R", "SQL"]
    },
    {
      name: "Maria Silva",
      role: "NLP Research Scientist",
      expertise: ["Machine Translation", "Cross-lingual NLP", "Language Models"],
      location: "Brazil",
      languages: ["Portuguese", "English", "Spanish", "Python", "PyTorch"]
    },
    {
      name: "Priya Shah",
      role: "ML Infrastructure Lead",
      expertise: ["ML Systems", "Scalable Computing", "DevOps"],
      location: "India",
      languages: ["Hindi", "English", "Python", "Go", "Kubernetes"]
    },
    {
      name: "Laura Romano",
      role: "Computer Vision Lead",
      expertise: ["Medical Imaging", "Deep Learning", "Image Segmentation"],
      location: "Italy",
      languages: ["Italian", "English", "Python", "PyTorch", "TensorFlow"]
    },
    {
      name: "Emma Larsson",
      role: "Robotics AI Lead",
      expertise: ["Robot Learning", "Control Systems", "Sim2Real"],
      location: "Sweden",
      languages: ["Swedish", "English", "Python", "C++", "ROS"]
    },
    {
      name: "Yuki Sato",
      role: "ML Research Scientist",
      expertise: ["Optimization", "Neural Networks", "AutoML"],
      location: "Japan",
      languages: ["Japanese", "English", "Python", "JAX", "PyTorch"]
    },
    {
      name: "Fatima Ahmad",
      role: "AI Privacy Researcher",
      expertise: ["Federated Learning", "Differential Privacy", "Secure ML"],
      location: "Qatar",
      languages: ["Arabic", "English", "Python", "Julia", "TensorFlow"]
    },
    {
      name: "Sarah Thompson",
      role: "ML Platform Lead",
      expertise: ["MLOps", "Cloud Infrastructure", "Model Deployment"],
      location: "Australia",
      languages: ["English", "Python", "Go", "Rust", "Docker"]
    },
    {
      name: "Min Park",
      role: "ML Systems Researcher",
      expertise: ["Distributed Training", "Model Optimization", "Edge Computing"],
      location: "South Korea",
      languages: ["Korean", "English", "Python", "C++", "CUDA"]
    }
  ]
};

async function generateAuthorProfile(author) {
  const slug = author.name.toLowerCase().replace(/\s+/g, '-');
  const dir = resolve(process.cwd(), 'src/content/authors', slug);
  
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const content = `---
name: "${author.name}"
role: "${author.role}"
bio: "${author.name} is a leading ${author.role} specializing in ${author.expertise.join(', ')}. Their innovative work has contributed to significant advancements in AI technology and its practical applications."
shortBio: "${author.role} focusing on ${author.expertise.slice(0, 2).join(' and ')}"
expertise:
${author.expertise.map(e => `  - "${e}"`).join('\n')}
avatar: "/images/authors/${slug}.webp"
social:
  twitter: "https://twitter.com/${slug}"
  linkedin: "https://linkedin.com/in/${slug}"
location: "${author.location}"
languages:
${author.languages.map(l => `  - "${l}"`).join('\n')}
featured: true
slug: "${slug}"
---

${author.name} is at the forefront of ${author.expertise[0]} research, focusing on developing innovative solutions in ${author.expertise[1]} and ${author.expertise[2]}. Their work spans both theoretical foundations and practical applications of AI technology.

As a respected voice in the AI community, ${author.name.split(' ')[0]} frequently speaks at international conferences and contributes to open-source projects. Their research has been particularly influential in advancing the field of ${author.expertise[0]}.

${author.name.split(' ')[0]}'s commitment to advancing AI technology while considering its broader implications has established them as a thought leader in the field. They continue to push the boundaries of what's possible in ${author.expertise[1]}, inspiring the next generation of AI researchers and practitioners.`;

  await writeFile(resolve(dir, 'index.md'), content, 'utf-8');
  console.log(`Generated profile for ${author.name}`);
}

async function main() {
  console.log('Generating author profiles...');

  for (const author of [...AUTHORS.male, ...AUTHORS.female]) {
    await generateAuthorProfile(author);
  }

  console.log('All author profiles generated successfully!');
}

main().catch(console.error);