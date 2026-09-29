import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/shared/Layout';
import { PageHeader } from '../components/ui/Table';
import { FaIcon } from '../components/shared/FaIcon';
import { ProductTable } from '../components/Products/ProductTable';
import { ProductFormModal } from '../components/Products/ProductFormModal';
import { ProductDetailSidebar } from '../components/Products/ProductDetailSidebar';
import { BulkImportModal } from '../components/Products/BulkImportModal';
import { PromoteModal } from '../components/Products/PromoteModal';
import { useConfirm } from '../components/ui/confirm';
import { useAuth } from '../hooks/useAuth';
import { useFeature } from '../hooks/useAccount';
import { useToast } from '../hooks/useToast';
import { 
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkImportProducts,
  StockInput
} from '../services/db';
import { Product } from '../types';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const catalogOn = useFeature('catalog');
  const importOn = useFeature('bulkImport');
  const promoteOn = useFeature('promote');
  const stockOn = useFeature('stock');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [promoteProduct, setPromoteProduct] = useState<Product | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // `?new=1` (sidebar "Create" menu) opens the add form directly, then drops the param.
  useEffect(() => {
    if (searchParams.get('new')) {
      setEditingProduct(null);
      setIsFormOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);


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
    file: File | null,
    hsn: string,
    unit: string,
    stock?: StockInput
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
          file,
          hsn,
          unit,
          stock
        );
        toast.success('Product updated successfully');
      } else {
        await addProduct(user.uid, name, price, file, hsn, unit, stock);
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
      message: `Are you sure you want to permanently delete ${toDelete.length} selected item${toDelete.length > 1 ? 's' : ''}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await bulkDeleteProducts(toDelete.map((p) => p.id));
      toast.success(`Deleted ${toDelete.length} item${toDelete.length > 1 ? 's' : ''}`);
      if (selectedProduct && toDelete.some((p) => p.id === selectedProduct.id)) {
        setSelectedProduct(null);
      }
      loadProductsList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete selected products');
    }
  };

  const handleShareCatalog = async () => {
    if (!user) return;
    // Full public URL, HashRouter-aware and base-path-aware for GitHub Pages.
    const url = `${window.location.origin}${import.meta.env.BASE_URL}#/catalog/${user.uid}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Catalog link copied! Share it on WhatsApp/Instagram.');
    } catch {
      // Clipboard blocked (e.g. insecure context) — open it so they can copy manually.
      window.open(url, '_blank');
      toast.success('Catalog opened in a new tab.');
    }
  };

  const handleBulkImport = async (items: Parameters<typeof bulkImportProducts>[1]) => {
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
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Products' }]}
        title="Products"
        subtitle="Products and pricing used on your invoices and online catalog."
        actions={
          <>
            {catalogOn && (
              <button onClick={handleShareCatalog} className="btn-secondary flex items-center gap-2 h-10 px-3.5 text-sm" title="Copy your public catalog link">
                <FaIcon icon="fa-solid fa-share-nodes" size={13} />
                Share Catalog
              </button>
            )}
            {importOn && (
              <button onClick={() => setIsImportOpen(true)} className="btn-secondary flex items-center gap-2 h-10 px-3.5 text-sm">
                <FaIcon icon="fa-solid fa-file-import" size={13} />
                Import
              </button>
            )}
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="btn-primary flex items-center gap-2 h-10 px-4 text-sm"
            >
              <FaIcon icon="fa-solid fa-plus" size={12} />
              Add Product
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-brand-500" size={36} />
          <p className="text-slate-500 font-medium">Loading inventory...</p>
        </div>
      ) : (
        <ProductTable
          products={products}
          initialSearch={searchParams.get('q') || ''}
          onView={(p) => setSelectedProduct(p)}
          onEdit={(p) => {
            setEditingProduct(p);
            setIsFormOpen(true);
          }}
          onDelete={handleDeleteProduct}
          onBulkDelete={handleBulkDelete}
          onPromote={promoteOn ? (p) => setPromoteProduct(p) : undefined}
          showStock={stockOn}
          initialLowOnly={searchParams.get('stock') === 'low'}
        />
      )}

      {/* Form Modal */}
      <ProductFormModal 
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddOrEditProduct}
        product={editingProduct}
        showStock={stockOn}
      />

      {/* Detail Sidebar */}
      <ProductDetailSidebar 
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Promote / Marketing Modal */}
      <PromoteModal
        product={promoteProduct}
        onClose={() => setPromoteProduct(null)}
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
