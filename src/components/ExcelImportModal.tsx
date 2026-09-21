import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CategoryData, ClassifiedExcelProduct, Product } from '../types';
import { formatPrice } from '../data/products';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryData[];
  onImportComplete: (importedCount: number, megaOffersAdded: number, updatedCategories?: CategoryData[], updatedMegaOffers?: Product[]) => void;
  showToast: (msg: string) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  onImportComplete,
  showToast
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [classifiedProducts, setClassifiedProducts] = useState<ClassifiedExcelProduct[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'mega_offer' | 'regular_offer' | 'standard'>('ALL');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');
  const [isImporting, setIsImporting] = useState(false);
  const [clearPreviousOnImport, setClearPreviousOnImport] = useState(false);
  const [isClearingNow, setIsClearingNow] = useState(false);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard botillería categories to guarantee options in modal
  const standardModalCategories = [
    { id: 'cat-bebidas', name: 'Bebidas, Aguas & Hielo' },
    { id: 'cat-cervezas', name: 'Cervezas & Artesanales' },
    { id: 'cat-vinos', name: 'Vinos & Espumantes' },
    { id: 'cat-destilados', name: 'Destilados & Piscos' },
    { id: 'cat-snacks', name: 'Snacks & Picoteos' },
    { id: 'cat-aperitivos', name: 'Aperitivos & Licores' }
  ];

  // Combine parent categories with standard templates and any newly discovered categories
  const availableModalCategories = React.useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => map.set(c.id, c.name));
    standardModalCategories.forEach(c => {
      if (!map.has(c.id)) map.set(c.id, c.name);
    });
    classifiedProducts.forEach(p => {
      if (p.categoryId && p.categoryName && !map.has(p.categoryId)) {
        map.set(p.categoryId, p.categoryName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [categories, classifiedProducts]);

  if (!isOpen) return null;

  // Clear previous catalog products directly
  const handleClearPreviousNow = async () => {
    if (!window.confirm('¿Seguro que deseas eliminar TODOS los productos anteriores del catálogo? Esta acción dejará el catálogo vacío para empezar de cero.')) return;
    setIsClearingNow(true);
    try {
      const res = await fetch('/api/products/clear-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onImportComplete(0, 0, data.categories, data.megaOffers);
        showToast(`¡Se han eliminado ${data.totalDeleted || 0} productos anteriores! El catálogo está vacío.`);
      } else {
        showToast('Error al vaciar catálogo en el servidor');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al vaciar catálogo');
    } finally {
      setIsClearingNow(false);
    }
  };

  // Reclassify entire current catalog with deep Gemini Botillería AI
  const handleReclassifyExistingCatalog = async () => {
    if (!window.confirm('¿Deseas que la IA analice atentamente TODOS los productos actuales de tu tienda y los reorganice en sus pasillos correctos según sus nombres completos?')) return;
    setIsReclassifying(true);
    try {
      const res = await fetch('/api/admin/reclassify-catalog', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        onImportComplete(data.totalReorganized || 0, data.counts?.megaOffers || 0, data.categories, data.megaOffers);
        showToast(data.message || '¡Catálogo reorganizado exitosamente con Inteligencia Artificial!');
      } else {
        showToast(data.error || 'Error al reorganizar catálogo');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión al reorganizar catálogo');
    } finally {
      setIsReclassifying(false);
    }
  };

  // 1. Generate & Download Sample Excel (.xlsx)
  const handleDownloadSampleExcel = () => {
    try {
      const sampleData = [
        {
          Producto: 'Agua Mineral Vital con Gas 1.5L',
          Precio: 1390,
          Precio_Original: 1690,
          Stock: 45,
          Marca: 'Vital'
        },
        {
          Producto: 'Agua Mineral Cachantún sin Gas 1.6L',
          Precio: 1290,
          Precio_Original: 1590,
          Stock: 40,
          Marca: 'Cachantún'
        },
        {
          Producto: 'Pack Piscola Mistral 35° 1L + Coca-Cola 1.5L + Hielo',
          Precio: 10990,
          Precio_Original: 14990,
          Stock: 30,
          Marca: 'Mistral'
        },
        {
          Producto: 'Coca-Cola Original 1.5L Helada',
          Precio: 1990,
          Precio_Original: 2390,
          Stock: 50,
          Marca: 'Coca-Cola'
        },
        {
          Producto: 'Pack Cerveza Heineken 24 Latas 350ml Heladas',
          Precio: 18990,
          Precio_Original: 24990,
          Stock: 25,
          Marca: 'Heineken'
        },
        {
          Producto: 'Whisky Johnnie Walker Black Label 750ml',
          Precio: 24990,
          Precio_Original: 31990,
          Stock: 15,
          Marca: 'Johnnie Walker'
        },
        {
          Producto: 'Vino Casillero del Diablo Reserva Cabernet Sauvignon 750ml',
          Precio: 4990,
          Precio_Original: 6490,
          Stock: 40,
          Marca: 'Casillero del Diablo'
        },
        {
          Producto: 'Espumante Valdivieso Brut 750ml Helado',
          Precio: 4490,
          Precio_Original: 5990,
          Stock: 20,
          Marca: 'Valdivieso'
        },
        {
          Producto: 'Aperitivo Aperol 750ml',
          Precio: 11990,
          Precio_Original: 13990,
          Stock: 18,
          Marca: 'Aperol'
        },
        {
          Producto: 'Gin Tanqueray London Dry 750ml',
          Precio: 15990,
          Precio_Original: 19990,
          Stock: 12,
          Marca: 'Tanqueray'
        },
        {
          Producto: 'Pack Corona Extra 6 Botellas 330ml',
          Precio: 6490,
          Precio_Original: 7990,
          Stock: 35,
          Marca: 'Corona'
        },
        {
          Producto: 'Papas Fritas Lays Corte Americano 250g',
          Precio: 2490,
          Precio_Original: 2890,
          Stock: 50,
          Marca: 'Lays'
        },
        {
          Producto: 'Bolsa de Hielo Purificado 2kg en Cubos',
          Precio: 1500,
          Precio_Original: 1990,
          Stock: 100,
          Marca: 'Hielo Polar'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, 'Planilla_Fellas_Market_Ejemplo.xlsx');
      showToast('Descargando planilla de ejemplo en formato Excel (.xlsx)...');
    } catch (e) {
      console.error(e);
      showToast('Error al generar la planilla de ejemplo');
    }
  };

  // 2. Load Instant Demo Dataset
  const handleLoadDemoDataset = async () => {
    const demoItems = [
      { name: 'Agua Mineral Vital con Gas 1.5L', price: 1390, originalPrice: 1690, stock: 45 },
      { name: 'Agua Mineral Cachantún sin Gas 1.6L', price: 1290, originalPrice: 1590, stock: 40 },
      { name: 'Coca-Cola Original 1.5L Helada', price: 1990, originalPrice: 2390, stock: 50 },
      { name: 'Pack Piscola Mistral 35° 1L + Coca-Cola 1.5L + Hielo', price: 10990, originalPrice: 14990, stock: 30 },
      { name: 'Pack Cerveza Heineken 24 Latas 350ml Heladas', price: 18990, originalPrice: 24990, stock: 25 },
      { name: 'Whisky Johnnie Walker Black Label 750ml', price: 24990, originalPrice: 31990, stock: 15 },
      { name: 'Vino Casillero del Diablo Reserva Cabernet Sauvignon 750ml', price: 4990, originalPrice: 6490, stock: 40 },
      { name: 'Espumante Valdivieso Brut 750ml Helado', price: 4490, originalPrice: 5990, stock: 20 },
      { name: 'Aperitivo Aperol 750ml', price: 11990, originalPrice: 13990, stock: 18 },
      { name: 'Gin Tanqueray London Dry 750ml', price: 15990, originalPrice: 19990, stock: 12 },
      { name: 'Pack Cerveza Corona Extra 6 Botellas 330ml', price: 6490, originalPrice: 7990, stock: 35 },
      { name: 'Papas Fritas Lays Corte Americano 250g', price: 2490, originalPrice: 2890, stock: 50 },
      { name: 'Bolsa de Hielo Purificado 2kg en Cubos', price: 1500, originalPrice: 1990, stock: 100 }
    ];

    processRawItemsWithAI(demoItems);
  };

  // 3. Read uploaded file (.xlsx, .xls, .csv)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    parseFile(uploadedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    parseFile(droppedFile);
  };

  const parseFile = async (uploadedFile: File) => {
    setIsProcessing(true);
    setProcessingStatus('Leyendo archivo Excel y analizando columnas...');

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

      if (rawJson.length === 0) {
        showToast('El archivo Excel está vacío o no tiene filas legibles');
        setIsProcessing(false);
        return;
      }

      // Map rows looking for name/title, price, category, and brand with robust matching
      const parsedItems = rawJson.map((row) => {
        let name = '';
        let price = 0;
        let originalPrice: number | undefined = undefined;
        let stock = 24;
        let rawCategory = '';
        let brand = '';

        // Pass 1: Match by explicit headers
        for (const [key, val] of Object.entries(row)) {
          const k = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const vStr = String(val).trim();
          if (!vStr) continue;

          // Product title / name column: accepts titulo, title, nombre, producto, articulo, descripcion, glosa, detalle, etc.
          if (/^(titulo|titulos|title|titles|nombre|nombres|name|names|producto|productos|product|products|articulo|articulos|item|items|descripcion|desc|detalle|glosa|concepto|denominacion|mercaderia|etiqueta)$/i.test(k) && !name) {
            name = vStr;
          } else if (/(titulo|title|nombre|producto|articulo|descripcion)/i.test(k) && !name && !/(categoria|rubro|tipo|familia)/i.test(k)) {
            name = vStr;
          }
          // Category / Department / Family column
          else if (/^(categoria|category|rubro|familia|subfamilia|seccion|departamento|depto|linea|grupo|pasillo)$/i.test(k) && !rawCategory) {
            rawCategory = vStr;
          }
          // Brand column
          else if (/^(marca|brand|fabricante|proveedor)$/i.test(k) && !brand) {
            brand = vStr;
          }
          // Original price / Normal price / Price before
          else if (/^(original|normal|anterior|referencia|antes|precio_original|precio_normal)$/i.test(k) || /(original|anterior|referencia|antes)/i.test(k)) {
            const num = Number(vStr.replace(/[^0-9]/g, ''));
            if (!isNaN(num) && num > 0) originalPrice = num;
          }
          // Regular Price column
          else if (/^(precio|valor|monto|price|costo|p_venta|venta|pvp)$/i.test(k) || /(precio|valor|monto|costo)/i.test(k)) {
            const num = Number(vStr.replace(/[^0-9]/g, ''));
            if (!isNaN(num) && num > 0 && price === 0) price = num;
          }
          // Stock column
          else if (/^(stock|cantidad|unidades|qty|cant|inventario)$/i.test(k) || /(stock|cantidad|unidades)/i.test(k)) {
            const num = Number(vStr.replace(/[^0-9]/g, ''));
            if (!isNaN(num) && num >= 0) stock = num;
          }
        }

        // Pass 2: Fallback if name is still not found, find the first string field that is not a number or code
        if (!name) {
          for (const [key, val] of Object.entries(row)) {
            const vStr = String(val).trim();
            // Check if string has letters, length >= 3, and isn't just digits
            if (vStr.length >= 3 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(vStr)) {
              const isPriceOrStock = /precio|price|valor|stock|qty|total|monto|id|codigo|sku|cod/i.test(key);
              if (!isPriceOrStock) {
                name = vStr;
                break;
              }
            }
          }
        }

        // If price is missing but originalPrice exists, swap
        if (price === 0 && originalPrice && originalPrice > 0) {
          price = originalPrice;
          originalPrice = undefined;
        }

        return {
          name,
          price,
          originalPrice,
          stock,
          rawCategory,
          brand
        };
      }).filter(item => item.name && item.price > 0);

      if (parsedItems.length === 0) {
        showToast('No se detectaron productos con nombre y precio válido en el archivo.');
        setIsProcessing(false);
        return;
      }

      await processRawItemsWithAI(parsedItems);
    } catch (err: any) {
      console.error(err);
      showToast('Error al leer el archivo Excel. Asegúrate que sea formato .xlsx, .xls o .csv.');
      setIsProcessing(false);
    }
  };

  // 4. Call server endpoint with Gemini AI
  const processRawItemsWithAI = async (items: Array<{ name: string; price: number; originalPrice?: number; stock?: number; rawCategory?: string; brand?: string }>) => {
    setIsProcessing(true);
    setProcessingStatus(`Clasificando ${items.length} productos con IA (Google Gemini 3.8 Flash)...`);

    try {
      const payload = {
        items,
        existingCategories: categories.map(c => ({ id: c.id, name: c.name }))
      };

      const res = await fetch('/api/admin/classify-excel-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error en el servicio de clasificación con IA');
      }

      const data = await res.json();
      setClassifiedProducts(data.products || []);
      showToast(`¡${data.total} productos clasificados con IA exitosamente!`);
    } catch (err: any) {
      console.error(err);
      showToast('Error al clasificar productos con IA.');
    } finally {
      setIsProcessing(false);
    }
  };

  // User modification handlers
  const handleToggleSelectAll = (checked: boolean) => {
    setClassifiedProducts(prev => prev.map(p => ({ ...p, selected: checked })));
  };

  const handleToggleProduct = (id: string) => {
    setClassifiedProducts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const handleUpdateProductField = (id: string, field: keyof ClassifiedExcelProduct, value: any) => {
    setClassifiedProducts(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, [field]: value };
      
      // Auto-recalculate discount if price or originalPrice changes
      if (field === 'price' || field === 'originalPrice') {
        if (updated.originalPrice && updated.originalPrice > updated.price) {
          const pct = Math.round(((updated.originalPrice - updated.price) / updated.originalPrice) * 100);
          updated.discount = `-${pct}%`;
        } else {
          updated.discount = undefined;
        }
      }

      // If categoryId changes, sync categoryName
      if (field === 'categoryId') {
        const cat = availableModalCategories.find(c => c.id === value);
        if (cat) updated.categoryName = cat.name;
      }

      return updated;
    }));
  };

  // 5. Confirm and Bulk Import to Store
  const handleExecuteImport = async () => {
    const selected = classifiedProducts.filter(p => p.selected);
    if (selected.length === 0) {
      showToast('Selecciona al menos un producto para importar.');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selected,
          clearPrevious: clearPreviousOnImport
        })
      });

      if (!res.ok) {
        throw new Error('Error al importar productos al catálogo');
      }

      const data = await res.json();
      onImportComplete(data.importedCount, data.megaOffersAdded, data.categories, data.megaOffers);
      showToast(`¡${data.importedCount} productos importados con éxito! (${data.megaOffersAdded} en Mega Ofertas).`);
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast('Error al importar los productos.');
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = classifiedProducts.filter(p => p.selected).length;
  const megaOffersCount = classifiedProducts.filter(p => p.offerType === 'mega_offer').length;
  const regularOffersCount = classifiedProducts.filter(p => p.offerType === 'regular_offer').length;
  const standardCount = classifiedProducts.filter(p => p.offerType === 'standard').length;

  const filteredProducts = classifiedProducts.filter(p => {
    const matchType = filterType === 'ALL' || p.offerType === filterType;
    const matchCat = selectedCatFilter === 'ALL' || p.categoryId === selectedCatFilter;
    return matchType && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#181818] border border-gray-800 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                  Importador de Planillas Excel con IA
                </h3>
                <span className="bg-[#ffd025] text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Sube una lista con nombres y precios; la IA clasificará pasillos, subcategorías y destacará Ofertas y Mega Promos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* STEP 1: Upload / Drop Zone if no products classified yet */}
          {classifiedProducts.length === 0 && !isProcessing && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-[#ffd025] rounded-3xl p-8 sm:p-12 text-center bg-[#141414]/60 hover:bg-[#141414] transition duration-300 cursor-pointer group flex flex-col items-center justify-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl mb-4 group-hover:scale-110 transition">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Arrastra tu archivo Excel aquí o haz clic para seleccionarlo
                </h4>
                <p className="text-xs text-gray-400 max-w-md">
                  Formatos compatibles: <strong className="text-emerald-400">.xlsx</strong>, <strong className="text-emerald-400">.xls</strong> o <strong className="text-emerald-400">.csv</strong>. 
                  Solo requiere que contenga columnas de <strong>Nombre</strong> y <strong>Precio</strong>.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#ffd025] font-semibold bg-[#ffd025]/10 px-3 py-1 rounded-full">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Detección y clasificación automática con IA en segundos</span>
                </div>
              </div>

              {/* Quick Action helpers */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="w-full sm:w-auto bg-[#1f1f1f] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-download text-emerald-400"></i>
                  <span>Descargar Plantilla Excel (.xlsx)</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleReclassifyExistingCatalog}
                    disabled={isReclassifying}
                    className="w-full sm:w-auto bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 hover:text-white border border-purple-700/70 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
                    title="Reorganizar con IA los productos que ya están en la tienda"
                  >
                    <i className={`fa-solid ${isReclassifying ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} text-purple-300`}></i>
                    <span>{isReclassifying ? 'Reorganizando...' : 'Reorganizar Catálogo con IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearPreviousNow}
                    disabled={isClearingNow}
                    className="w-full sm:w-auto bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/80 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    title="Eliminar todos los productos anteriores para no borrarlos uno por uno"
                  >
                    <i className="fa-solid fa-trash-can text-red-400"></i>
                    <span>{isClearingNow ? 'Vaciando...' : 'Vaciar Catálogo Anterior'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemoDataset}
                    className="w-full sm:w-auto bg-[#ffd025] hover:bg-yellow-400 text-[#141414] text-xs font-black px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95"
                  >
                    <i className="fa-solid fa-bolt"></i>
                    <span>Planilla de Prueba (1 clic)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Processing state indicator */}
          {isProcessing && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#ffd025]/20 border-t-[#ffd025] animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-[#ffd025] text-lg">
                  <i className="fa-solid fa-brain"></i>
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  {processingStatus || 'Procesando planilla con Inteligencia Artificial...'}
                </h4>
                <p className="text-xs text-gray-400 max-w-md">
                  Gemini está reconociendo marcas, categorizando pasillos, calculando precios de oferta y sugiriendo packs para la portada.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Review, Tweak and Confirm Products Table */}
          {classifiedProducts.length > 0 && !isProcessing && (
            <div className="space-y-4">
              
              {/* Summary KPIs bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#141414] border border-gray-800 rounded-2xl p-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Total Detectados</span>
                  <div className="text-lg font-black text-white mt-0.5">{classifiedProducts.length} productos</div>
                  <span className="text-[10px] text-emerald-400 font-bold">{selectedCount} seleccionados</span>
                </div>
                
                <div className="bg-[#141414] border border-red-900/40 rounded-2xl p-3">
                  <span className="text-[10px] text-red-400 uppercase font-bold block">🔥 Mega Ofertas</span>
                  <div className="text-lg font-black text-red-400 mt-0.5">{megaOffersCount} productos</div>
                  <span className="text-[10px] text-gray-400">Promociones para portada</span>
                </div>

                <div className="bg-[#141414] border border-amber-900/40 rounded-2xl p-3">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">🏷️ Ofertas</span>
                  <div className="text-lg font-black text-amber-400 mt-0.5">{regularOffersCount} productos</div>
                  <span className="text-[10px] text-gray-400">Con precio tachado</span>
                </div>

                <div className="bg-[#141414] border border-gray-800 rounded-2xl p-3">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">📦 Catálogo Estándar</span>
                  <div className="text-lg font-black text-gray-300 mt-0.5">{standardCount} productos</div>
                  <span className="text-[10px] text-gray-500">Precio regular</span>
                </div>
              </div>

              {/* Filters and Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#141414] p-3 rounded-2xl border border-gray-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold mr-1">Filtrar por:</span>
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterType === 'ALL' ? 'bg-[#ffd025] text-black' : 'bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    Todos ({classifiedProducts.length})
                  </button>
                  <button
                    onClick={() => setFilterType('mega_offer')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterType === 'mega_offer' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    🔥 Mega Ofertas ({megaOffersCount})
                  </button>
                  <button
                    onClick={() => setFilterType('regular_offer')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterType === 'regular_offer' ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    🏷️ Ofertas ({regularOffersCount})
                  </button>
                  <button
                    onClick={() => setFilterType('standard')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      filterType === 'standard' ? 'bg-stone-700 text-white' : 'bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    Estándar ({standardCount})
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <select
                    value={selectedCatFilter}
                    onChange={(e) => setSelectedCatFilter(e.target.value)}
                    className="bg-[#1f1f1f] text-gray-200 text-xs rounded-xl px-3 py-1.5 border border-gray-700 outline-none focus:border-[#ffd025]"
                  >
                    <option value="ALL">Todos los Pasillos</option>
                    {availableModalCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleToggleSelectAll(selectedCount !== classifiedProducts.length)}
                    className="text-xs text-[#ffd025] hover:underline font-bold whitespace-nowrap cursor-pointer"
                  >
                    {selectedCount === classifiedProducts.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                  </button>
                </div>
              </div>

              {/* Products Table / Cards */}
              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        prod.selected
                          ? 'bg-[#1b1b1b] border-gray-700 hover:border-[#ffd025]/50'
                          : 'bg-[#141414]/50 border-gray-900 opacity-60'
                      }`}
                    >
                      {/* Checkbox and Product preview */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={prod.selected}
                          onChange={() => handleToggleProduct(prod.id)}
                          className="w-4 h-4 rounded text-[#ffd025] focus:ring-0 cursor-pointer accent-[#ffd025]"
                        />

                        <div className="w-12 h-12 rounded-xl bg-[#141414] shrink-0 overflow-hidden border border-gray-800 p-1 flex items-center justify-center">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold text-[#ffd025] uppercase tracking-wider">
                              {prod.subcategory || prod.categoryName}
                            </span>
                            {prod.brand && (
                              <span className="text-[10px] text-gray-500 font-medium">
                                • {prod.brand}
                              </span>
                            )}
                          </div>
                          
                          <input
                            type="text"
                            value={prod.name}
                            onChange={(e) => handleUpdateProductField(prod.id, 'name', e.target.value)}
                            className="w-full bg-transparent text-xs font-bold text-white outline-none border-b border-transparent focus:border-[#ffd025] py-0.5 truncate"
                          />

                          {prod.aiReason && (
                            <p className="text-[10px] text-gray-400 italic line-clamp-1 mt-0.5">
                              {prod.aiReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls: Pasillo / Categoría y Tipo de Oferta */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                        {/* Pasillo selector */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Pasillo</span>
                          <select
                            value={prod.categoryId}
                            onChange={(e) => handleUpdateProductField(prod.id, 'categoryId', e.target.value)}
                            className="bg-[#141414] text-gray-200 text-xs rounded-lg px-2 py-1 border border-gray-700 outline-none focus:border-[#ffd025]"
                          >
                            {availableModalCategories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Clasificación de Oferta */}
                        <div className="flex flex-col">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Tipo de Oferta</span>
                          <select
                            value={prod.offerType}
                            onChange={(e) => handleUpdateProductField(prod.id, 'offerType', e.target.value)}
                            className={`text-xs font-bold rounded-lg px-2 py-1 border outline-none ${
                              prod.offerType === 'mega_offer'
                                ? 'bg-red-950/60 text-red-300 border-red-700'
                                : prod.offerType === 'regular_offer'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-700'
                                : 'bg-[#141414] text-gray-300 border-gray-700'
                            }`}
                          >
                            <option value="mega_offer">🔥 Mega Oferta</option>
                            <option value="regular_offer">🏷️ Oferta</option>
                            <option value="standard">📦 Estándar</option>
                          </select>
                        </div>

                        {/* Precios: Actual y Anterior tachado */}
                        <div className="flex flex-col items-end min-w-[120px] shrink-0">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Precio / Antes</span>
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {hasDiscount && (
                              <span className="text-[11px] font-bold text-red-500 line-through decoration-red-500 decoration-2">
                                {formatPrice(prod.originalPrice!)}
                              </span>
                            )}
                            <span className="text-sm font-black text-white">
                              {formatPrice(prod.price)}
                            </span>
                            {prod.discount && (
                              <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.2 rounded shadow shrink-0">
                                {prod.discount}
                              </span>
                            )}
                          </div>
                          
                          {/* Toggle Disponibilidad sin conteo numérico */}
                          <button
                            type="button"
                            onClick={() => handleUpdateProductField(prod.id, 'inStock' as any, prod.inStock === false ? true : false)}
                            title={prod.inStock === false ? 'Hacer clic para marcar EN STOCK' : 'Hacer clic para marcar SIN STOCK'}
                            className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 transition border cursor-pointer ${
                              prod.inStock === false
                                ? 'bg-red-950/80 text-red-300 border-red-800'
                                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.inStock === false ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
                            <span>{prod.inStock === false ? 'Sin stock' : 'En stock'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-800 bg-[#141414] flex flex-col sm:flex-row items-center justify-between gap-3">
          {classifiedProducts.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setClassifiedProducts([]);
                    setFile(null);
                  }}
                  className="text-xs text-gray-400 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <i className="fa-solid fa-arrow-rotate-left"></i>
                  <span>Subir otra planilla</span>
                </button>

                <label className="flex items-center gap-2 cursor-pointer bg-red-950/30 hover:bg-red-950/50 border border-red-800/60 px-3 py-1.5 rounded-xl text-xs text-red-200 select-none transition">
                  <input
                    type="checkbox"
                    checked={clearPreviousOnImport}
                    onChange={(e) => setClearPreviousOnImport(e.target.checked)}
                    className="accent-red-500 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5 font-bold">
                    <i className="fa-solid fa-trash-can text-red-400 text-[11px]"></i>
                    <span>Borrar productos anteriores al importar</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedCount === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className="w-1/2 sm:w-auto bg-[#ffd025] hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-[#141414] text-xs font-black px-6 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow cursor-pointer active:scale-95"
                >
                  {isImporting ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      <span>Guardando en catálogo...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check"></i>
                      <span>Importar {selectedCount} Productos al Catálogo</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
