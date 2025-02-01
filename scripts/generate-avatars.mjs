import Replicate from 'replicate';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { authors } from './authors.mjs';

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable is required');
  process.exit(1);
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const AVATAR_DIR = resolve(process.cwd(), 'public/images/authors');

// Ensure avatar directory exists
if (!existsSync(AVATAR_DIR)) {
  await mkdir(AVATAR_DIR, { recursive: true });
}

function generatePrompt(author) {
  const { gender, ethnicity, appearance } = author;
  const { age, face, hair, expression, distinguishing } = appearance;

  // Base prompt structure
  const prompt = [
    `Professional headshot of a ${age}-year-old ${ethnicity} ${gender},`,
    face,
    hair,
    expression,
    distinguishing,
    'High-end professional photography, natural lighting, studio setting, 4k, highly detailed, photorealistic.',
    'Professional attire, clean background.'
  ].join(' ');

  // Negative prompt to avoid common issues
  const negativePrompt = [
    'cartoon, anime, illustration, painting, drawing, artwork',
    'deformed, distorted, disfigured, poorly drawn, bad anatomy, wrong anatomy, extra limb, missing limb, floating limbs, disconnected limbs, mutation, mutated',
    'watermark, text, error, signature, timestamp',
    'out of frame, bad framing, cropped',
    'multiple people, multiple faces',
    'blurry, noisy, low quality, pixelated'
  ].join(', ');

  return { prompt, negativePrompt };
}

async function generateAvatar(author) {
  const { name } = author;
  console.log(`🎨 Generating avatar for ${name}...`);
  
  try {
    const { prompt, negativePrompt } = generatePrompt(author);
    console.log('\nPrompt:', prompt);
    
    const output = await replicate.run(
      "xlabs-ai/flux-dev-realism:0.1.0",
      {
        input: {
          prompt,
          negative_prompt: negativePrompt,
          width: 768,
          height: 768,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
        }
      }
    );

    // Download and process the image
    const response = await fetch(output[0]);
    const imageBuffer = await response.arrayBuffer();
    
    // Process with sharp
    const processedImage = await sharp(Buffer.from(imageBuffer))
      .resize(400, 400, {
        fit: 'cover',
        position: 'face'
      })
      .jpeg({ 
        quality: 90,
        progressive: true
      })
      .toBuffer();

    const avatarPath = join(AVATAR_DIR, `${name.toLowerCase().replace(/\s+/g, '-')}.jpg`);
    await writeFile(avatarPath, processedImage);
    
    console.log(`✅ Generated avatar for ${name}`);
    return `/images/authors/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  } catch (err) {
    console.error(`❌ Failed to generate avatar for ${name}:`, err);
    return null;
  }
}

async function main() {
  console.log('🚀 Generating author avatars...\n');
  
  let success = 0;
  let failed = 0;

  // Process male authors
  for (const author of authors.male) {
    try {
      const result = await generateAvatar(author);
      if (result) {
        success++;
        // Add delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ Failed to process ${author.name}:`, err);
      failed++;
    }
  }

  // Process female authors
  for (const author of authors.female) {
    try {
      const result = await generateAvatar(author);
      if (result) {
        success++;
        // Add delay between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        failed++;
      }
    } catch (err) {
      console.error(`❌ Failed to process ${author.name}:`, err);
      failed++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successfully generated: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});