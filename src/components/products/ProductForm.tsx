import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductFormProps {
  product?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export const ProductForm = ({ product, onSave, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    category: "",
    price: "",
    cost_price: "",
    stock_quantity: "",
    low_stock_threshold: "10",
    image_url: ""
  });
  const [loading, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        sku: product.sku || "",
        category: product.category || "",
        price: product.price?.toString() || "",
        cost_price: product.cost_price?.toString() || "",
        stock_quantity: product.stock_quantity?.toString() || "",
        low_stock_threshold: product.low_stock_threshold?.toString() || "10",
        image_url: product.image_url || ""
      });
    }
    loadCategories();
  }, [product]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("category")
        .eq("user_id", user?.id)
        .not("category", "is", null);

      if (error) throw error;

      const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({
        title: "Image uploaded",
        description: "Product image has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    if (!formData.stock_quantity || isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock quantity",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      let error;
      
      if (product) {
        // Update existing product
        const updateData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          sku: formData.sku.trim() || null,
          category: formData.category.trim() || null,
          price: Number(formData.price),
          cost_price: Number(formData.cost_price) || 0,
          stock_quantity: Number(formData.stock_quantity),
          low_stock_threshold: Number(formData.low_stock_threshold) || 10,
          image_url: formData.image_url || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        };
        
        const { error: updateError } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", product.id)
          .eq("user_id", user?.id);
        error = updateError;
      } else {
        // Create new product
        const insertData = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          sku: formData.sku.trim() || null,
          category: formData.category.trim() || null,
          price: Number(formData.price),
          cost_price: Number(formData.cost_price) || 0,
          stock_quantity: Number(formData.stock_quantity),
          low_stock_threshold: Number(formData.low_stock_threshold) || 10,
          image_url: formData.image_url || null,
          user_id: user?.id,
          created_by: user?.id
        };
        
        const { error: insertError } = await supabase
          .from("products")
          .insert([insertData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: product ? "Product updated" : "Product created",
        description: `Product has been ${product ? "updated" : "created"} successfully`
      });

      onSave();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Save failed",
        description: error.message || "Failed to save product",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter product name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="Product SKU (optional)"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Product description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select or enter category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Or type new category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="flex-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Selling Price (₦) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_price">Cost Price (₦)</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price}
            onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock Quantity *</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
          <Input
            id="low_stock_threshold"
            type="number"
            min="0"
            value={formData.low_stock_threshold}
            onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
            placeholder="10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Product Image</Label>
        <div className="space-y-4">
          {formData.image_url && (
            <div className="relative inline-block">
              <img 
                src={formData.image_url} 
                alt="Product preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary-dark"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {product ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              {product ? "Update Product" : "Create Product"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};