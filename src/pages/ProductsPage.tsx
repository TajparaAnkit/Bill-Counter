import React, { useEffect, useState } from 'react';
import { Layout } from '../components/shared/Layout';
import { FaIcon } from '../components/shared/FaIcon';
import { ProductTable } from '../components/Products/ProductTable';
import { ProductFormModal } from '../components/Products/ProductFormModal';
import { ProductDetailSidebar } from '../components/Products/ProductDetailSidebar';
import { BulkImportModal } from '../components/Products/BulkImportModal';
import { useConfirm } from '../components/ui/confirm';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { 
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkImportProducts
} from '../services/db';
import { Product } from '../types';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadProductsList = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      console.log('Loading products for user:', user.uid);
      const data = await getProducts(user.uid);
      console.log('Loaded products:', data);
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProductsList();
    }
  }, [user]);

  const handleAddOrEditProduct = async (
    name: string, 
    price: number, 
    file: File | null
  ) => {
    if (!user) return;
    try {
      if (editingProduct) {
        await updateProduct(
          user.uid, 
          editingProduct.id, 
          name, 
          price, 
          editingProduct.imageUrl, 
          file
        );
        toast.success('Product updated successfully');
      } else {
        await addProduct(user.uid, name, price, file);
        toast.success('Product added successfully');
      }
      loadProductsList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
      throw err;
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const ok = await confirm({
      title: 'Delete Product',
      message: `Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted successfully');
      loadProductsList();
      if (selectedProduct?.id === product.id) {
        setSelectedProduct(null);
      }
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const handleBulkDelete = async (toDelete: Product[]) => {
    const ok = await confirm({
      title: `Delete ${toDelete.length} Product${toDelete.length > 1 ? 's' : ''}`,
      message: `Are you sure you want to permanently delete ${toDelete.length} selected product${toDelete.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await bulkDeleteProducts(toDelete.map((p) => p.id));
      toast.success(`Deleted ${toDelete.length} product${toDelete.length > 1 ? 's' : ''}`);
      if (selectedProduct && toDelete.some((p) => p.id === selectedProduct.id)) {
        setSelectedProduct(null);
      }
      loadProductsList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected products');
    }
  };

  const handleBulkImport = async (items: { name: string; price: number; imageUrl?: string }[]) => {
    if (!user) return;
    try {
      await bulkImportProducts(user.uid, items);
      loadProductsList();
    } catch (err) {
      toast.error('Bulk import failed');
      throw err;
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 font-display">Products</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Manage your products and inventory pricing</p>
          </div>
          <div className="flex items-center space-x-3.5">
            <button 
              onClick={() => setIsImportOpen(true)}
              className="btn-secondary flex items-center space-x-2 py-2.5 px-4.5"
            >
              <FaIcon icon="fa-solid fa-download" size={16} />
              <span>Import</span>
            </button>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="btn-primary flex items-center space-x-2 py-2.5 px-4.5"
            >
              <FaIcon icon="fa-solid fa-plus" size={16} />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-blue-500" size={40} />
            <p className="text-gray-500 font-medium">Loading inventory...</p>
          </div>
        ) : (
          <ProductTable 
            products={products}
            onView={(p) => setSelectedProduct(p)}
            onEdit={(p) => {
              setEditingProduct(p);
              setIsFormOpen(true);
            }}
            onDelete={handleDeleteProduct}
            onBulkDelete={handleBulkDelete}
          />
        )}
      </div>

      {/* Form Modal */}
      <ProductFormModal 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddOrEditProduct}
        product={editingProduct}
      />

      {/* Detail Sidebar */}
      <ProductDetailSidebar 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal 
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
      />
    </Layout>
  );
};
