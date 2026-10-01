import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { api } from '@/services/api';
import ProductView from '../../../_components/product/ProductView';

const getProduct = cache(api.getProduct);

type Props = { params: Promise<{ category: string; product: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).product);
  return { title: product?.name ?? 'Product not found', description: product?.description };
}

export default async function ApparelProductPage({ params }: Props) {
  const { category, product: id } = await params;
  const [product, related] = await Promise.all([getProduct(id), api.getRelatedProducts(id, 4)]);
  // The URL must match where the product lives, so one product has one address.
  if (!product || product.ref.section !== 'apparel' || product.ref.category !== category) notFound();
  return <ProductView product={product} related={related} />;
}
