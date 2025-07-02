-- Create storage policies for product images (bucket already exists)
CREATE POLICY "Users can upload their own product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Make product images publicly viewable
CREATE POLICY "Product images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');