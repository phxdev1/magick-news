import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { authors } from './authors.mjs';
import sharp from 'sharp';

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable is required');
  process.exit(1);
}

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
    `Professional headshot portrait of a ${age}-year-old ${ethnicity} ${gender}.`,
    face,
    hair,
    expression,
    distinguishing,
    'The photo is taken in a professional studio setting with soft, natural lighting.',
    'High-end DSLR photography, 4k, highly detailed, photorealistic.',
    'Professional business attire, clean neutral background.',
    'Looking directly at camera with a confident, approachable expression.'
  ].join(' ');

  return prompt;
}

async function waitForPrediction(predictionId) {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check prediction status: ${response.status} ${response.statusText}`);
    }

    const prediction = await response.json();
    
    if (prediction.status === 'succeeded') {
      return prediction.output[0];
    } else if (prediction.status === 'failed') {
      throw new Error(`Prediction failed: ${prediction.error}`);
    }

    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    // Log progress
    console.log(`Waiting for image generation... (${attempts}/${maxAttempts})`);
  }

  throw new Error('Prediction timed out');
}

async function makeReplicateRequest(prompt) {
  // Start the prediction
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: "39b3434f194f87a900d1bc2b6d4b983e90f0dde1d5022c27b52c143d670758fa",
      input: {
        prompt,
        guidance: 7.5,
        num_outputs: 1,
        aspect_ratio: "1:1",
        lora_strength: 0.8,
        output_format: "webp",
        output_quality: 100,
        num_inference_steps: 50
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Replicate API error: ${response.status} ${response.statusText}\n${text}`);
  }

  const prediction = await response.json();
  console.log('Started prediction:', prediction.id);
  
  // Wait for the prediction to complete
  return await waitForPrediction(prediction.id);
}

async function processImage(imageBuffer, name) {
  try {
    // First try with face detection
    const processedImage = await sharp(imageBuffer)
      .resize({
        width: 400,
        height: 400,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy
      })
      .webp({ 
        quality: 90,
        effort: 6
      })
      .toBuffer();

    return processedImage;
  } catch (err) {
    console.warn(`Warning: Advanced image processing failed, falling back to simple resize for ${name}:`, err.message);
    
    // Fallback to simple center crop
    return await sharp(imageBuffer)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ 
        quality: 90,
        effort: 6
      })
      .toBuffer();
  }
}

async function generateAvatar(author) {
  const { name } = author;
  console.log(`\n🎨 Generating avatar for ${name}...`);
  
  try {
    const prompt = generatePrompt(author);
    console.log('\nPrompt:', prompt);
    
    const imageUrl = await makeReplicateRequest(prompt);
    console.log('\nImage URL:', imageUrl);

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    console.log('Downloaded image, processing...');

    // Process the image
    const processedImage = await processImage(Buffer.from(imageBuffer), name);
    
    const avatarPath = join(AVATAR_DIR, `${name.toLowerCase().replace(/\s+/g, '-')}.webp`);
    await writeFile(avatarPath, processedImage);
    
    console.log(`✅ Generated avatar for ${name}`);
    return `/images/authors/${name.toLowerCase().replace(/\s+/g, '-')}.webp`;
  } catch (err) {
    console.error(`❌ Failed to generate avatar for ${name}:`, err);
    return null;
  }
}

async function main() {
  console.log('🚀 Generating author avatars...\n');
  
  let success = 0;
  let failed = 0;
  const errors = [];

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
        errors.push(`Failed to generate avatar for ${author.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${author.name}:`, err);
      failed++;
      errors.push(`Error processing ${author.name}: ${err.message}`);
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
        errors.push(`Failed to generate avatar for ${author.name}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${author.name}:`, err);
      failed++;
      errors.push(`Error processing ${author.name}: ${err.message}`);
    }
  }

  console.log('\n📊 Results:');
  console.log(`✅ Successfully generated: ${success}`);
  console.log(`❌ Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.log(`  - ${error}`));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});