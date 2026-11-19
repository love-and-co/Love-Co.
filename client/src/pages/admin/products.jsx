import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import AdminLayout from '../../modules/admin/components/AdminLayout';
import AdminWorkspaceSkeleton from '../../modules/admin/components/AdminWorkspaceSkeleton';

const ProductsView = dynamic(
  () => import('../../modules/admin/views/ProductsView'),
  {
    ssr: false,
    loading: () => <AdminWorkspaceSkeleton />,
  }
);

export { PRODUCTS_STORAGE_KEY } from '../../modules/admin/utils/stockSync';

export default function AdminProductsPage() {
  return (
    <AdminLayout activeTab="Inventory">
      <Head>
        <title>Inventory | Love & Co. Admin</title>
      </Head>
      <ProductsView />
    </AdminLayout>
  );
}
