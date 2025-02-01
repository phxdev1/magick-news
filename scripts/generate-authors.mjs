import Replicate from 'replicate';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { authors } from './authors.mjs';

// You'll need to set REPLICATE_API_TOKEN in your environment
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const AUTHOR_DIR = resolve(process.cwd(), 'src/content/authors');
const AVATAR_DIR = resolve(process.cwd(), 'public/images/authors');

// Ensure directories exist
await mkdir(AUTHOR_DIR, { recursive: true });
await mkdir(AVATAR_DIR, { recursive: true });

async function generateAvatar(name, gender) {
  console.log(`🎨 Generating avatar for ${name}...`);
  
  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: `Professional headshot of a ${gender === 'female' ? 'woman' : 'man'} researcher, data scientist, or tech professional. High quality, natural lighting, neutral background, professional attire. Photorealistic style.`,
          negative_prompt: "cartoon, anime, illustration, distorted features, unrealistic",
          width: 768,
          height: 768,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
        }
      }
    );

    // Download and process the image
    const response = await fetch(output[0]);
    const imageBuffer = await response.arrayBuffer();
    
    // Process with sharp
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .resize(400, 400)
      .jpeg({ quality: 90 })
      .toBuffer();

    const avatarPath = join(AVATAR_DIR, `${name.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    await writeFile(avatarPath, processedImage);
    
    return `/images/authors/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  } catch (err) {
    console.error(`Failed to generate avatar for ${name}:`, err);
    return null;
  }
}

function generateBio(author) {
  const { name, expertise, education } = author;
  const pronouns = author.gender === 'female' ? { subj: 'she', obj: 'her', poss: 'her' } : { subj: 'he', obj: 'him', poss: 'his' };
  
  const intro = `${name} is a distinguished expert in ${expertise.slice(0, -1).join(', ')}, and ${expertise[expertise.length - 1]}.`;
  
  const educationText = education ? 
    `${pronouns.subj.charAt(0).toUpperCase() + pronouns.subj.slice(1)} holds a ${education[0].degree} in ${education[0].field} from ${education[0].institution}.` : '';
  
  const expertise_detail = `With a deep passion for ${expertise[0]}, ${pronouns.subj} has contributed significantly to the field through ${pronouns.poss} research and publications.`;
  
  const impact = `${pronouns.poss.charAt(0).toUpperCase() + pronouns.poss.slice(1)} work has helped shape the understanding of ${expertise[1]} and its applications in modern technology.`;
  
  return `${intro} ${educationText} ${expertise_detail} ${impact}`;
}

async function generateAuthorProfile(author) {
  const { name, gender } = author;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const avatarPath = await generateAvatar(name, gender);
  
  if (!avatarPath) {
    throw new Error(`Failed to generate avatar for ${name}`);
  }

  const profile = {
    ...author,
    avatar: avatarPath,
    shortBio: generateBio(author).split('.')[0] + '.',
    bio: generateBio(author),
    slug
  };

  const content = `---\n${JSON.stringify(profile, null, 2)}\n---\n`;
  const filePath = join(AUTHOR_DIR, `${slug}.md`);
  
  await writeFile(filePath, content);
  console.log(`✅ Generated profile for ${name}`);
}

async function main() {
  console.log('🚀 Generating author profiles...\n');
  
  for (const author of authors.male.concat(authors.female)) {
    try {
      await generateAuthorProfile(author);
    } catch (err) {
      console.error(`❌ Failed to generate profile for ${author.name}:`, err);
    }
  }
  
  console.log('\n✨ Author profile generation complete!');
}

main().catch(console.error);