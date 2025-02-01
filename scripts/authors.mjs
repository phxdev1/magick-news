import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

const AUTHORS_FILE = resolve(process.cwd(), 'src/content/authors/data.json');

export const authorTemplates = {
  male: [
    {
      name: 'Alexander Hunt',
      gender: 'male',
      ethnicity: 'caucasian',
      appearance: {
        age: 35,
        face: 'Square-jawed with defined cheekbones, light stubble, and a strong brow. Clear blue eyes with a focused, analytical gaze.',
        hair: 'Short sandy brown hair, neatly styled with a slight side part',
        expression: 'Confident but approachable smile, with slight laugh lines around the eyes',
        distinguishing: 'Wire-rimmed glasses that complement his academic appearance'
      },
      role: 'AI Research Scientist',
      expertise: ['Machine Learning', 'Neural Networks', 'Computer Vision'],
      location: 'Cambridge, MA',
      languages: ['English', 'Python', 'Julia'],
      education: [
        {
          degree: 'Ph.D.',
          field: 'Computer Science',
          institution: 'MIT',
          year: 2020
        }
      ],
      social: {
        twitter: 'https://twitter.com/alexhunt_ai',
        github: 'https://github.com/alexhunt',
        linkedin: 'https://linkedin.com/in/alexhunt'
      }
    },
    // ... rest of male authors ...
  ],
  female: [
    {
      name: 'Sophia Martín',
      gender: 'female',
      ethnicity: 'hispanic',
      appearance: {
        age: 33,
        face: 'Striking features with warm brown eyes and high cheekbones. Natural elegance with a Mediterranean glow.',
        hair: 'Long dark brown hair with subtle waves, often worn professionally styled',
        expression: 'Confident, engaging smile that lights up her whole face',
        distinguishing: 'Beauty mark above left side of lip'
      },
      role: 'AI Research Lead',
      expertise: ['Reinforcement Learning', 'Game Theory', 'Multi-agent Systems'],
      location: 'Madrid, Spain',
      languages: ['Spanish', 'English', 'Python', 'JAX'],
      education: [
        {
          degree: 'Ph.D.',
          field: 'Artificial Intelligence',
          institution: 'Technical University of Madrid',
          year: 2019
        }
      ]
    },
    // ... rest of female authors ...
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