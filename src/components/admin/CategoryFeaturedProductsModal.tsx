import React, { useState, useEffect, useMemo } from 'react';
import { CategoryData, Product } from '../../types';

interface CategoryFeaturedProductsModalProps {
  isOpen: boolean;
  category: CategoryData | null;
  onClose: () => void;
  onSaveFeaturedProducts: (categoryId: string, featuredProductIds: string[]) => void;
  showToast: (msg: string) => void;
}

export const CategoryFeaturedProductsModal: React.FC<CategoryFeaturedProductsModalProps> = ({
  isOpen,
  category,
  onClose,
  onSaveFeaturedProducts,
  showToast
}) => {
  if (!isOpen || !category) return null;

  // Initialize with existing featuredProductIds or first 6 of the category
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (category.featuredProductIds && category.featuredProductIds.length > 0) {
      // Filter out any IDs that might no longer exist in category.products
      const valid = category.featuredProductIds.filter(id => 
        category.products.some(p => p.id === id)
      );
      return valid.slice(0, 6);
    }
    return category.products.slice(0, 6).map(p => p.id);
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize when category changes
  useEffect(() => {
    if (category) {
      if (category.featuredProductIds && category.featuredProductIds.length > 0) {
        const valid = category.featuredProductIds.filter(id => 
          category.products.some(p => p.id === id)
        );
        setSelectedIds(valid.slice(0, 6));
      } else {
        setSelectedIds(category.products.slice(0, 6).map(p => p.id));
      }
    }
  }, [category]);

  // Map selected IDs to product objects
  const selectedProducts = useMemo(() => {
    return selectedIds
      .map(id => category.products.find(p => p.id === id))
      .filter((p): p is Product => !!p);
  }, [selectedIds, category.products]);

  // Filtered available products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return category.products;
    return category.products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(q))
    );
  }, [category.products, searchQuery]);

  // Handlers for slot re-ordering and management
  const handleMove = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= selectedIds.length) return;

    const updated = [...selectedIds];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setSelectedIds(updated);
  };

  const handleRemove = (productId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== productId));
  };

  const handleAdd = (productId: string) => {
    if (selectedIds.includes(productId)) {
      handleRemove(productId);
      return;
    }
    if (selectedIds.length >= 6) {
      showToast('Ya tienes 6 productos seleccionados. Quita uno antes de añadir otro.');
      return;
    }
    setSelectedIds(prev => [...prev, productId]);
  };

  const handleResetToDefault = () => {
    setSelectedIds(category.products.slice(0, 6).map(p => p.id));
    showToast('Restablecido a los primeros 6 productos del catálogo');
  };

  const handleClear = () => {
    setSelectedIds([]);
    showToast('Selección vaciada. El catálogo usará los primeros por defecto.');
  };

  const handleSave = () => {
    onSaveFeaturedProducts(category.id, selectedIds);
    showToast(`Guardados los ${selectedIds.length} productos de portada para "${category.name}"`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#171719] border border-[#ffd025]/30 rounded-3xl w-full max-w-4xl shadow-2xl p-5 sm:p-7 relative my-8 flex flex-col max-h-[92vh]">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#242426] hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header */}
        <div className="border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
            <i className="fa-solid fa-star"></i>
            <span>Sección de Portada & Tienda Alterna</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Elegir los 6 Productos: {category.name}</span>
          </h3>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Selecciona el orden exacto de los 6 productos visibles en la portada principal.
            <strong className="text-amber-300 ml-1">
              En modo Tienda Alterna de Emergencia, estos serán los únicos productos accesibles para los clientes.
            </strong>
          </p>
        </div>

        {/* 6 SLOTS CONTAINER */}
        <div className="bg-[#121214] border border-stone-800/80 rounded-2xl p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-stone-200">
                Productos Seleccionados ({selectedIds.length} de 6)
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedIds.length === 6 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {selectedIds.length === 6 ? 'Completo (6/6)' : `Faltan ${6 - selectedIds.length}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] text-stone-400 hover:text-white transition underline cursor-pointer"
              >
                Primeros 6 automáticos
              </button>
              <span className="text-stone-700">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-rose-400 hover:text-rose-300 transition underline cursor-pointer"
              >
                Vaciar
              </button>
            </div>
          </div>

          {/* 6 Grid Slots */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((slotIdx) => {
              const prod = selectedProducts[slotIdx];
              return (
                <div
                  key={`slot-${slotIdx}`}
                  className={`rounded-xl p-2.5 flex flex-col justify-between relative border transition min-h-[160px] ${
                    prod
                      ? 'bg-[#1b1b1e] border-amber-500/40 shadow-sm'
                      : 'bg-[#141416] border-dashed border-stone-800 text-stone-600 justify-center items-center'
                  }`}
                >
                  {/* Position Tag */}
                  <span className={`absolute -top-2 -left-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow ${
                    prod ? 'bg-[#ffd025] text-stone-950 font-mono' : 'bg-stone-800 text-stone-500'
                  }`}>
                    {slotIdx + 1}
                  </span>

                  {prod ? (
                    <>
                      <div className="flex flex-col items-center text-center">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-14 h-14 object-contain rounded-lg bg-stone-900/50 p-1 mb-1.5"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <h5 className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                          {prod.name}
                        </h5>
                        <span className="text-[11px] font-black text-amber-400 mt-1">
                          ${prod.price?.toLocaleString('es-CL')}
                        </span>
                      </div>

                      {/* Move & Remove Controls */}
                      <div className="flex items-center justify-between border-t border-stone-800/80 pt-1.5 mt-2">
                        <button
                          type="button"
                          disabled={slotIdx === 0}
                          onClick={() => handleMove(slotIdx, 'left')}
                          className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 flex items-center justify-center text-[9px] cursor-pointer disabled:cursor-not-allowed"
                          title="Mover hacia la izquierda"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(prod.id)}
                          className="w-5 h-5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 flex items-center justify-center text-[10px] cursor-pointer"
                          title="Quitar de destacados"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          disabled={slotIdx === selectedProducts.length - 1}
                          onClick={() => handleMove(slotIdx, 'right')}
                          className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 disabled:opacity-30 text-stone-300 flex items-center justify-center text-[9px] cursor-pointer disabled:cursor-not-allowed"
                          title="Mover hacia la derecha"
                        >
                          ▶
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <i className="fa-regular fa-square-plus text-stone-600 text-lg mb-1 block"></i>
                      <span className="text-[10px] font-medium text-stone-500 block leading-tight">
                        Espacio #{slotIdx + 1} libre
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PRODUCT CATALOG SEARCH & SELECTION LIST */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h4 className="text-xs font-black uppercase text-stone-300 flex items-center gap-1.5">
              <i className="fa-solid fa-list-check text-amber-400"></i>
              <span>Todos los productos de {category.name} ({category.products.length})</span>
            </h4>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-stone-500 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o marca..."
                className="w-full bg-[#121214] border border-stone-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#ffd025]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-stone-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Product Grid / List */}
          <div className="overflow-y-auto flex-1 pr-1 space-y-2 max-h-[300px]">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-xs bg-[#121214] rounded-2xl border border-stone-800">
                No se encontraron productos con el término "{searchQuery}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const selectedIndex = selectedIds.indexOf(p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleAdd(p.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 text-white'
                          : 'bg-[#131315] hover:bg-[#1c1c20] border-stone-800 text-stone-300'
                      }`}
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-11 h-11 object-contain rounded-lg bg-stone-900 p-1 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h6 className="text-xs font-bold truncate">{p.name}</h6>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs font-black text-amber-400">
                            ${p.price?.toLocaleString('es-CL')}
                          </span>
                          {p.brand && (
                            <span className="text-[10px] text-stone-500 truncate max-w-[90px]">
                              {p.brand}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action status pill */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="w-6 h-6 rounded-full bg-[#ffd025] text-stone-950 font-bold text-[10px] flex items-center justify-center shadow">
                            #{selectedIndex + 1}
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-400 text-xs flex items-center justify-center transition">
                            +
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-stone-800 mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#ffd025] hover:bg-yellow-400 text-stone-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <i className="fa-solid fa-check"></i>
            <span>Guardar Selección ({selectedIds.length} de 6)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
