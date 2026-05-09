
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndSync() {
  const imagesDir = '/tmp/images';
  const files = fs.readdirSync(imagesDir);

  // Fetch all products to match names
  const { data: products, error: fetchError } = await supabase
    .from('menu_items')
    .select('id, name');

  if (fetchError) {
    console.error('Error fetching products:', fetchError);
    process.exit(1);
  }

  for (const filename of files) {
    const filePath = path.join(imagesDir, filename);
    const fileNameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    
    // Exact match or handle special characters from unzip (like #U00c1 -> Á)
    let searchName = fileNameWithoutExt
      .replace(/#U00c1/g, 'Á')
      .replace(/#U00e1/g, 'á')
      .replace(/#U00d3/g, 'Ó')
      .replace(/#U00f3/g, 'ó')
      .replace(/#U00cd/g, 'Í')
      .replace(/#U00ed/g, 'í')
      .replace(/#U00da/g, 'Ú')
      .replace(/#U00fa/g, 'ú')
      .replace(/#U00c0/g, 'À')
      .replace(/#U00e0/g, 'à')
      .replace(/#U00c2/g, 'Â')
      .replace(/#U00e2/g, 'â')
      .replace(/#U00ca/g, 'Ê')
      .replace(/#U00ea/g, 'ê')
      .replace(/#U00d4/g, 'Ô')
      .replace(/#U00f4/g, 'ô')
      .replace(/#U00c7/g, 'Ç')
      .replace(/#U00e7/g, 'ç')
      .replace(/#U00c3/g, 'Ã')
      .replace(/#U00e3/g, 'ã')
      .replace(/#U00d5/g, 'Õ')
      .replace(/#U00f5/g, 'õ');

    const product = products.find(p => p.name.toLowerCase() === searchName.toLowerCase());

    if (product) {
      console.log(`Processing ${searchName} for product ${product.id}`);
      
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${Date.now()}-${filename.replace(/\s+/g, '_')}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('products')
        .upload(storagePath, fileBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error(`Error uploading ${filename}:`, uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(storagePath);

      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ image_url: publicUrl })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError);
      } else {
        console.log(`Successfully updated ${product.name} with ${publicUrl}`);
      }
    } else {
      console.log(`No product found for filename: ${filename} (searched as: ${searchName})`);
    }
  }
}

uploadAndSync();
