import React, { useState, useEffect, useRef } from 'react';
import { StoreSettings, CategoryData } from '../../types';
import { Footer } from '../Footer';

interface FooterEditorProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  categories: CategoryData[];
  showToast: (msg: string) => void;
}

export const FooterEditor: React.FC<FooterEditorProps> = ({
  settings,
  onUpdateSettings,
  categories,
  showToast
}) => {
  const [form, setForm] = useState<StoreSettings>({ ...settings });
  const [newZone, setNewZone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    onUpdateSettings(form);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast('¡Pie de página guardado y actualizado con éxito!');
      } else {
        showToast('Ajustes guardados localmente');
      }
    } catch (err) {
      console.error(err);
      showToast('Ajustes guardados localmente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddZone = () => {
    if (!newZone.trim()) return;
    const currentZones = form.deliveryZones || [];
    if (currentZones.includes(newZone.trim())) {
      showToast('Esta zona ya está en la lista de despacho');
      return;
    }
    const updated = {
      ...form,
      deliveryZones: [...currentZones, newZone.trim()]
    };
    setForm(updated);
    setNewZone('');
    showToast(`Zona "${newZone.trim()}" agregada`);
  };

  const handleRemoveZone = (zoneToRemove: string) => {
    const updatedZones = (form.deliveryZones || []).filter(z => z !== zoneToRemove);
    setForm({ ...form, deliveryZones: updatedZones });
    showToast(`Zona "${zoneToRemove}" eliminada`);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setForm(prev => ({ ...prev, logoImage: dataUrl }));
        showToast('Logo cargado correctamente');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Header del Editor de Pie de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a1a] p-6 rounded-3xl border border-gray-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ffd025] mb-1">
            <i className="fa-solid fa-window-maximize"></i> Editor de Pie de Página (Footer)
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Personalización Total del Pie de Página
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Edita los nombres de marca, logotipo, textos descriptivos, redes sociales, títulos de cada columna, horarios de atención, dirección, teléfonos y textos legales.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-[#ffd025]/20 cursor-pointer uppercase shrink-0"
        >
          <i className="fa-solid fa-floppy-disk text-sm"></i>
          <span>{isSaving ? 'Guardando...' : 'Guardar Pie de Página'}</span>
        </button>
      </div>

      {/* Formulario de Configuración en Bloques Temáticos */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* BLOQUE 1: MARCA, LOGO Y REDES SOCIALES */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#ffd025] flex items-center justify-center text-sm border border-amber-500/30">
              <i className="fa-solid fa-store"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Columna 1: Marca, Descripción & Redes Sociales
              </h3>
              <p className="text-[11px] text-gray-400">
                Identidad visual y enlaces de contacto directo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Texto Primario Marca *
              </label>
              <input
                type="text"
                required
                value={form.logoTextPrimary}
                onChange={(e) => setForm({ ...form, logoTextPrimary: e.target.value })}
                placeholder="FELLA'S"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Texto Acento Marca *
              </label>
              <input
                type="text"
                required
                value={form.logoTextAccent}
                onChange={(e) => setForm({ ...form, logoTextAccent: e.target.value })}
                placeholder="MARKET"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>
          </div>

          {/* Logo Imagen opcional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-300 uppercase">
                Imagen del Logotipo (URL o Archivo)
              </label>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="text-xs text-[#ffd025] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <i className="fa-solid fa-upload"></i>
                <span>Subir logo desde PC</span>
              </button>
            </div>

            <input
              type="file"
              ref={logoInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="flex gap-2">
              <input
                type="text"
                value={form.logoImage || ''}
                onChange={(e) => setForm({ ...form, logoImage: e.target.value })}
                placeholder="URL de imagen del logo (o sube un archivo PNG/SVG)"
                className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
              {form.logoImage && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoImage: '' })}
                  className="px-3 py-2 bg-red-950/40 text-red-300 hover:text-white border border-red-800 rounded-xl text-xs font-bold"
                >
                  Quitar Logo
                </button>
              )}
            </div>
          </div>

          {/* Texto Acerca de */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Texto Acerca de la Tienda (Footer About)
            </label>
            <textarea
              rows={3}
              value={form.footerAbout || ''}
              onChange={(e) => setForm({ ...form, footerAbout: e.target.value })}
              placeholder="Botillería oficial con despacho express en Alerce y Puerto Montt..."
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>

          {/* Enlaces a Redes Sociales */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Enlaces a Redes Sociales
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <i className="fa-brands fa-instagram text-pink-400"></i> Instagram
                </span>
                <input
                  type="text"
                  value={form.socialInstagram || ''}
                  onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <i className="fa-brands fa-whatsapp text-emerald-400"></i> WhatsApp
                </span>
                <input
                  type="text"
                  value={form.socialWhatsapp || ''}
                  onChange={(e) => setForm({ ...form, socialWhatsapp: e.target.value })}
                  placeholder="https://wa.me/569..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <i className="fa-brands fa-facebook text-blue-400"></i> Facebook
                </span>
                <input
                  type="text"
                  value={form.socialFacebook || ''}
                  onChange={(e) => setForm({ ...form, socialFacebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2 text-xs text-white focus:border-[#ffd025]"
                />
              </div>

              <div>
                <span className="text-[11px] text-gray-400 block mb-1 flex items-center gap-1">
                  <i className="fa-brands fa-x-twitter text-gray-300"></i> X / Twitter
                </span>
                <input
                  type="text"
                  value={form.socialTwitter || ''}
                  onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })}
                  placeholder="https://twitter.com/..."
                  className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2 text-xs text-white focus:border-[#ffd025]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE 2: COLUMNA DE PASILLOS & CATEGORÍAS */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm border border-purple-500/30">
              <i className="fa-solid fa-tags"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Columna 2: Título de Pasillos & Enlaces
              </h3>
              <p className="text-[11px] text-gray-400">
                Controla el encabezado de las categorías mostradas en el pie de página.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Título de la Columna *
            </label>
            <input
              type="text"
              required
              value={form.footerCategoriesTitle || 'Pasillos & Licores'}
              onChange={(e) => setForm({ ...form, footerCategoriesTitle: e.target.value })}
              placeholder="Pasillos & Licores"
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              * Los enlaces bajo este título se sincronizan automáticamente con las categorías activas de tu tienda ({categories.length} categorías registradas).
            </p>
          </div>
        </div>

        {/* BLOQUE 3: DESPACHO EXPRESS & ZONAS DE COBERTURA */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm border border-emerald-500/30">
              <i className="fa-solid fa-truck-fast"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Columna 3: Cobertura de Despacho & Títulos
              </h3>
              <p className="text-[11px] text-gray-400">
                Informa a tus clientes las comunas y sectores donde entregas rápidamente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Título Columna Despacho *
              </label>
              <input
                type="text"
                required
                value={form.footerDeliveryTitle || 'Despacho Express'}
                onChange={(e) => setForm({ ...form, footerDeliveryTitle: e.target.value })}
                placeholder="Despacho Express"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Subtítulo de Entregas
              </label>
              <input
                type="text"
                value={form.footerDeliverySubtitle || 'Entregas en menos de 45 minutos en:'}
                onChange={(e) => setForm({ ...form, footerDeliverySubtitle: e.target.value })}
                placeholder="Entregas en menos de 45 minutos en:"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Aviso / Promoción de Despacho
              </label>
              <input
                type="text"
                value={form.footerDeliveryNotice || 'Envío gratis sobre $50.000'}
                onChange={(e) => setForm({ ...form, footerDeliveryNotice: e.target.value })}
                placeholder="Envío gratis sobre $50.000"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>
          </div>

          {/* Gestor de Zonas de Cobertura */}
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-2">
              Zonas de Despacho Activas ({form.deliveryZones?.length || 0})
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddZone(); } }}
                placeholder="Ej: Mirador de la Bahía, Puerto Montt..."
                className="flex-1 bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
              <button
                type="button"
                onClick={handleAddZone}
                className="px-4 py-2 bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black text-xs rounded-xl shadow cursor-pointer uppercase flex items-center gap-1"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Agregar Zona</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(form.deliveryZones || []).map((zone) => (
                <span
                  key={zone}
                  className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-200 text-xs font-bold flex items-center gap-2 border border-gray-700 shadow-xs"
                >
                  <i className="fa-solid fa-location-dot text-[#ffd025] text-[10px]"></i>
                  <span>{zone}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zone)}
                    className="text-gray-400 hover:text-red-400 ml-1 transition"
                    title="Eliminar zona"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* BLOQUE 4: CONTACTO, DIRECCIÓN Y HORARIOS */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">
              <i className="fa-solid fa-phone"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Columna 4: Contacto, Horarios & Casa Matriz
              </h3>
              <p className="text-[11px] text-gray-400">
                Información para atención presencial y pedidos telefónicos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Título Columna Contacto *
              </label>
              <input
                type="text"
                required
                value={form.footerContactTitle || 'Contacto & Casa Matriz'}
                onChange={(e) => setForm({ ...form, footerContactTitle: e.target.value })}
                placeholder="Contacto & Casa Matriz"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Dirección Física
              </label>
              <input
                type="text"
                value={form.contactAddress || ''}
                onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
                placeholder="Av. Gabriela Mistral 1234, Alerce, Puerto Montt"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Teléfono / WhatsApp de Pedidos
              </label>
              <input
                type="text"
                value={form.contactPhone || ''}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                placeholder="+56 9 5886 6754"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={form.contactEmail || ''}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                placeholder="contacto@fellasmarket.cl"
                className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Horario de Atención de la Botillería
            </label>
            <input
              type="text"
              value={form.contactHours || 'Horario Botillería: Lun a Dom 12:00 - 03:00 hrs'}
              onChange={(e) => setForm({ ...form, contactHours: e.target.value })}
              placeholder="Horario Botillería: Lun a Dom 12:00 - 03:00 hrs"
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>
        </div>

        {/* BLOQUE 5: DERECHOS DE AUTOR & AVISO LEGAL */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-sm border border-red-500/30">
              <i className="fa-solid fa-scale-balanced"></i>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Fila Inferior: Derechos de Autor & Aviso Legal
              </h3>
              <p className="text-[11px] text-gray-400">
                Texto de copyright y advertencias de ley para botillerías (+18 años).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Texto de Copyright y Advertencia de Venta Responsable
            </label>
            <textarea
              rows={2}
              value={form.footerCopyrightText || 'Todos los derechos reservados. Venta exclusiva para mayores de 18 años.'}
              onChange={(e) => setForm({ ...form, footerCopyrightText: e.target.value })}
              placeholder="Todos los derechos reservados. Venta exclusiva para mayores de 18 años."
              className="w-full bg-[#141414] border border-gray-800 rounded-xl p-2.5 text-xs text-white focus:border-[#ffd025]"
            />
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#ffd025] hover:bg-yellow-400 disabled:opacity-50 text-[#141414] font-black text-xs px-8 py-3.5 rounded-xl transition shadow-xl cursor-pointer uppercase flex items-center gap-2"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <span>{isSaving ? 'Guardando en Servidor...' : 'Guardar Todos los Cambios del Pie de Página'}</span>
          </button>
        </div>
      </form>

      {/* VISTA PREVIA EN TIEMPO REAL DEL PIE DE PÁGINA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 tracking-wider">
            <i className="fa-solid fa-eye text-[#ffd025]"></i>
            <span>Vista Previa en Vivo del Pie de Página</span>
          </div>
          <span className="text-[11px] text-gray-500">
            Así es exactamente cómo se renderiza en la tienda online
          </span>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-gray-700 overflow-hidden shadow-2xl">
          <Footer settings={form} categories={categories} />
        </div>
      </div>
    </div>
  );
};
