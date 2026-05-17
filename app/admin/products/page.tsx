import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ include: { category: true, brand: true }, orderBy: { createdAt: "desc" } });
  return <div><h1 className="text-3xl font-black">Ürünler</h1><div className="mt-8 overflow-hidden rounded-2xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/10"><tr><th className="p-4">Ürün</th><th>SKU</th><th>Fiyat</th><th>Stok</th><th>Durum</th></tr></thead><tbody>{products.map((p) => <tr key={p.id} className="border-t border-white/10"><td className="p-4 font-bold">{p.name}<p className="font-normal text-slate-400">{p.category.name}</p></td><td>{p.sku}</td><td>{formatPrice(p.price.toString())}</td><td>{p.stock}</td><td>{p.isActive ? "Aktif" : "Pasif"}</td></tr>)}</tbody></table></div></div>;
}
