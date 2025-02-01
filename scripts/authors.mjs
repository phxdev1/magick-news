import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const AUTHORS_FILE = resolve(process.cwd(), 'src/content/authors/data.json');

export const authorTemplates = {
  male: [
    {
      name: 'John Anderson',
      gender: 'male',
      ethnicity: 'caucasian',
      appearance: {
        age: 35,
        face: 'Square-jawed with defined cheekbones, light stubble, and a strong brow. Clear blue eyes with a focused, analytical gaze.',
        hair: 'Short dark brown hair, neatly styled with a professional cut',
        expression: 'Confident but approachable smile, with slight laugh lines around the eyes',
        distinguishing: 'Wire-rimmed glasses that complement his academic appearance'
      },
      role: 'AI Research Scientist',
      expertise: ['Machine Learning', 'Neural Networks', 'Computer Vision'],
      location: 'United States',
      languages: ['English', 'Python', 'Julia']
    },
    {
      name: 'Pierre Martin',
      gender: 'male',
      ethnicity: 'caucasian',
      appearance: {
        age: 38,
        face: 'Well-defined features with expressive hazel eyes. Strong jawline and a thoughtful gaze.',
        hair: 'Salt and pepper hair, styled in a modern professional cut',
        expression: 'Warm, intellectual smile with a hint of curiosity',
        distinguishing: 'Distinguished greying at temples adds gravitas'
      },
      role: 'Deep Learning Engineer',
      expertise: ['Deep Learning', 'Natural Language Processing', 'Model Optimization'],
      location: 'France',
      languages: ['French', 'English', 'Python', 'PyTorch']
    },
    {
      name: 'Juan Garcia',
      gender: 'male',
      ethnicity: 'hispanic',
      appearance: {
        age: 42,
        face: 'Warm brown eyes and strong features. Engaging presence with a scholarly demeanor.',
        hair: 'Dark wavy hair with subtle grey at temples, professionally styled',
        expression: 'Thoughtful, empathetic smile that conveys wisdom',
        distinguishing: 'Distinguished beard neatly trimmed'
      },
      role: 'AI Ethics Researcher',
      expertise: ['AI Ethics', 'Responsible AI', 'Machine Learning'],
      location: 'Spain',
      languages: ['Spanish', 'English', 'Python', 'R']
    },
    {
      name: 'Raj Patel',
      gender: 'male',
      ethnicity: 'indian',
      appearance: {
        age: 36,
        face: 'Sharp, intelligent features with dark expressive eyes. Professional and approachable demeanor.',
        hair: 'Black hair styled in a modern professional cut',
        expression: 'Confident, friendly smile with an air of expertise',
        distinguishing: 'Modern rectangular glasses that frame his face well'
      },
      role: 'Machine Learning Architect',
      expertise: ['Distributed ML', 'Cloud Computing', 'MLOps'],
      location: 'India',
      languages: ['Hindi', 'English', 'Python', 'Go']
    },
    {
      name: 'Marco Rossi',
      gender: 'male',
      ethnicity: 'mediterranean',
      appearance: {
        age: 39,
        face: 'Classic Italian features with warm brown eyes. Engaging and charismatic presence.',
        hair: 'Dark wavy hair with styled sophistication',
        expression: 'Charismatic smile that conveys passion for technology',
        distinguishing: 'Light designer stubble perfectly maintained'
      },
      role: 'Robotics AI Researcher',
      expertise: ['Robotics', 'Computer Vision', 'Reinforcement Learning'],
      location: 'Italy',
      languages: ['Italian', 'English', 'Python', 'C++']
    },
    {
      name: 'Lars Jensen',
      gender: 'male',
      ethnicity: 'scandinavian',
      appearance: {
        age: 37,
        face: 'Nordic features with striking blue eyes. Clean-cut, professional appearance.',
        hair: 'Blonde hair in a classic professional style',
        expression: 'Focused, determined smile with a hint of warmth',
        distinguishing: 'Sharp, minimalist glasses reflecting Scandinavian design'
      },
      role: 'NLP Research Lead',
      expertise: ['Natural Language Processing', 'Transformer Models', 'Language Models'],
      location: 'Denmark',
      languages: ['Danish', 'English', 'Python', 'TensorFlow']
    },
    {
      name: 'Ken Tanaka',
      gender: 'male',
      ethnicity: 'asian',
      appearance: {
        age: 41,
        face: 'Refined features with keen dark eyes. Professional and focused demeanor.',
        hair: 'Black hair in a precise, professional cut',
        expression: 'Composed, thoughtful smile that suggests deep expertise',
        distinguishing: 'Modern titanium frames that complement his professional look'
      },
      role: 'Computer Vision Scientist',
      expertise: ['Computer Vision', 'Image Processing', 'Deep Learning'],
      location: 'Japan',
      languages: ['Japanese', 'English', 'Python', 'PyTorch']
    },
    {
      name: 'Ahmed Hassan',
      gender: 'male',
      ethnicity: 'middle eastern',
      appearance: {
        age: 34,
        face: 'Strong, defined features with dark expressive eyes. Professional and approachable.',
        hair: 'Dark hair styled with modern sophistication',
        expression: 'Confident, engaging smile that builds trust',
        distinguishing: 'Well-groomed short beard framing strong jawline'
      },
      role: 'AI Security Researcher',
      expertise: ['AI Security', 'Adversarial ML', 'Cybersecurity'],
      location: 'UAE',
      languages: ['Arabic', 'English', 'Python', 'Java']
    },
    {
      name: 'James Wilson',
      gender: 'male',
      ethnicity: 'caucasian',
      appearance: {
        age: 40,
        face: 'Classic British features with green eyes. Professional and composed demeanor.',
        hair: 'Brown hair with subtle grey, professionally styled',
        expression: 'Measured, confident smile that conveys experience',
        distinguishing: 'Subtle crow\'s feet that suggest wisdom and experience'
      },
      role: 'ML Infrastructure Lead',
      expertise: ['MLOps', 'Distributed Systems', 'Cloud Architecture'],
      location: 'United Kingdom',
      languages: ['English', 'Python', 'Go', 'Kubernetes']
    },
    {
      name: 'Wei Chen',
      gender: 'male',
      ethnicity: 'asian',
      appearance: {
        age: 38,
        face: 'Sharp, intelligent features with keen dark eyes. Modern and professional presence.',
        hair: 'Black hair in a contemporary business style',
        expression: 'Focused, approachable smile that suggests innovation',
        distinguishing: 'Modern rimless glasses that complement his tech-forward appearance'
      },
      role: 'ML Systems Architect',
      expertise: ['Distributed ML', 'High-Performance Computing', 'Model Serving'],
      location: 'Singapore',
      languages: ['Chinese', 'English', 'Python', 'C++']
    }
  ],
  female: [
    {
      name: 'Ana Rodriguez',
      gender: 'female',
      ethnicity: 'hispanic',
      appearance: {
        age: 36,
        face: 'Striking features with warm brown eyes and high cheekbones. Natural elegance with a Mediterranean glow.',
        hair: 'Long dark brown hair with subtle waves, professionally styled',
        expression: 'Confident, engaging smile that lights up her face',
        distinguishing: 'Natural beauty mark near her right eye'
      },
      role: 'AI Research Lead',
      expertise: ['Reinforcement Learning', 'Game Theory', 'Multi-agent Systems'],
      location: 'Spain',
      languages: ['Spanish', 'English', 'Python', 'JAX']
    },
    {
      name: 'Marie Bernard',
      gender: 'female',
      ethnicity: 'caucasian',
      appearance: {
        age: 39,
        face: 'Classic French features with bright green eyes. Sophisticated and intellectual presence.',
        hair: 'Shoulder-length brown hair styled with Parisian elegance',
        expression: 'Thoughtful smile that conveys deep understanding',
        distinguishing: 'Light freckles across nose and cheeks'
      },
      role: 'AI Ethics Director',
      expertise: ['AI Ethics', 'Policy', 'Fairness in ML'],
      location: 'Canada',
      languages: ['French', 'English', 'Python', 'R']
    },
    {
      name: 'Maria Silva',
      gender: 'female',
      ethnicity: 'latin',
      appearance: {
        age: 34,
        face: 'Vibrant features with expressive brown eyes. Warm and engaging presence.',
        hair: 'Dark curly hair worn in a professional style',
        expression: 'Bright, infectious smile that draws people in',
        distinguishing: 'Dimples that appear when she smiles'
      },
      role: 'NLP Research Scientist',
      expertise: ['Natural Language Processing', 'Machine Translation', 'Linguistics'],
      location: 'Brazil',
      languages: ['Portuguese', 'English', 'Spanish', 'Python']
    },
    {
      name: 'Priya Shah',
      gender: 'female',
      ethnicity: 'indian',
      appearance: {
        age: 35,
        face: 'Elegant features with bright dark eyes. Professional and approachable demeanor.',
        hair: 'Long black hair styled in a modern professional manner',
        expression: 'Warm, confident smile that builds rapport',
        distinguishing: 'Small diamond nose stud adds subtle sophistication'
      },
      role: 'ML Systems Architect',
      expertise: ['Distributed ML', 'System Design', 'Edge Computing'],
      location: 'India',
      languages: ['Hindi', 'English', 'Python', 'Go']
    },
    {
      name: 'Laura Romano',
      gender: 'female',
      ethnicity: 'mediterranean',
      appearance: {
        age: 37,
        face: 'Classic Italian beauty with warm hazel eyes. Engaging and professional presence.',
        hair: 'Dark wavy hair styled with natural elegance',
        expression: 'Passionate smile that conveys expertise',
        distinguishing: 'Graceful features that command attention'
      },
      role: 'Computer Vision Lead',
      expertise: ['Computer Vision', 'Deep Learning', 'Medical Imaging'],
      location: 'Italy',
      languages: ['Italian', 'English', 'Python', 'PyTorch']
    },
    {
      name: 'Emma Larsson',
      gender: 'female',
      ethnicity: 'scandinavian',
      appearance: {
        age: 38,
        face: 'Nordic features with clear blue eyes. Professional and focused demeanor.',
        hair: 'Blonde hair in an elegant bob cut',
        expression: 'Determined smile with a welcoming warmth',
        distinguishing: 'High cheekbones that catch the light'
      },
      role: 'Robotics AI Lead',
      expertise: ['Robotics', 'Control Systems', 'Reinforcement Learning'],
      location: 'Sweden',
      languages: ['Swedish', 'English', 'Python', 'C++']
    },
    {
      name: 'Yuki Sato',
      gender: 'female',
      ethnicity: 'asian',
      appearance: {
        age: 36,
        face: 'Refined features with bright dark eyes. Professional and innovative presence.',
        hair: 'Black hair in a sleek modern cut',
        expression: 'Focused smile that suggests deep knowledge',
        distinguishing: 'Elegant minimal makeup enhancing natural features'
      },
      role: 'ML Research Scientist',
      expertise: ['Machine Learning', 'Optimization', 'Neural Networks'],
      location: 'Japan',
      languages: ['Japanese', 'English', 'Python', 'TensorFlow']
    },
    {
      name: 'Fatima Ahmad',
      gender: 'female',
      ethnicity: 'middle eastern',
      appearance: {
        age: 33,
        face: 'Striking features with expressive dark eyes. Professional and confident presence.',
        hair: 'Dark hair styled with modern sophistication',
        expression: 'Confident smile that inspires trust',
        distinguishing: 'Subtle eyeliner enhancing her expressive eyes'
      },
      role: 'AI Privacy Researcher',
      expertise: ['Privacy-Preserving ML', 'Cryptography', 'Security'],
      location: 'Qatar',
      languages: ['Arabic', 'English', 'Python', 'Julia']
    },
    {
      name: 'Sarah Thompson',
      gender: 'female',
      ethnicity: 'caucasian',
      appearance: {
        age: 39,
        face: 'Classic features with bright green eyes. Professional and approachable demeanor.',
        hair: 'Auburn hair in a modern professional style',
        expression: 'Warm smile that builds connections',
        distinguishing: 'Natural makeup enhancing professional appearance'
      },
      role: 'ML Platform Lead',
      expertise: ['MLOps', 'Infrastructure', 'Scalable Systems'],
      location: 'Australia',
      languages: ['English', 'Python', 'Go', 'Rust']
    },
    {
      name: 'Min Park',
      gender: 'female',
      ethnicity: 'asian',
      appearance: {
        age: 35,
        face: 'Elegant features with bright dark eyes. Modern and innovative presence.',
        hair: 'Black hair in a contemporary professional style',
        expression: 'Focused smile suggesting technical expertise',
        distinguishing: 'Minimalist silver earrings complementing professional look'
      },
      role: 'ML Systems Researcher',
      expertise: ['Distributed Training', 'Model Optimization', 'Edge Computing'],
      location: 'South Korea',
      languages: ['Korean', 'English', 'Python', 'C++']
    }
  ]
};

export async function loadAuthors() {
  if (!existsSync(AUTHORS_FILE)) {
    return null;
  }

  try {
    const data = await readFile(AUTHORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load authors:', err);
    return null;
  }
}

export async function saveAuthors(authors) {
  try {
    await writeFile(AUTHORS_FILE, JSON.stringify(authors, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to save authors:', err);
    return false;
  }
}

export function validateAuthor(author) {
  // Check if author has required fields
  const requiredFields = ['name', 'gender', 'ethnicity', 'role', 'expertise', 'location', 'languages'];
  const missingFields = requiredFields.filter(field => !author[field]);
  
  if (missingFields.length > 0) {
    return {
      valid: false,
      errors: [`Missing required fields: ${missingFields.join(', ')}`]
    };
  }

  // Check if author has an avatar
  const avatarPath = resolve(process.cwd(), 'public/images/authors', `${author.name.toLowerCase().replace(/\s+/g, '-')}.webp`);
  if (!existsSync(avatarPath)) {
    return {
      valid: false,
      errors: ['Missing avatar image']
    };
  }

  return { valid: true };
}

export function validateAuthors(authors) {
  const errors = [];
  let valid = true;

  // Check male authors
  authors.male.forEach(author => {
    const result = validateAuthor(author);
    if (!result.valid) {
      valid = false;
      errors.push(`${author.name}: ${result.errors.join(', ')}`);
    }
  });

  // Check female authors
  authors.female.forEach(author => {
    const result = validateAuthor(author);
    if (!result.valid) {
      valid = false;
      errors.push(`${author.name}: ${result.errors.join(', ')}`);
    }
  });

  return { valid, errors };
}

export function listAuthors() {
  console.log('Available Authors:\n');
  console.log('Male Authors:');
  authorTemplates.male.forEach((author, i) => console.log(`${i + 1}. ${author.name}`));
  console.log('\nFemale Authors:');
  authorTemplates.female.forEach((author, i) => console.log(`${i + 1}. ${author.name}`));
}