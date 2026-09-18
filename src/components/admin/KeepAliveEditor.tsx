import React, { useState, useEffect } from 'react';
import { StoreSettings, KeepAliveStats, KeepAliveLog } from '../../types';

interface KeepAliveEditorProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  showToast: (msg: string) => void;
}

export const KeepAliveEditor: React.FC<KeepAliveEditorProps> = ({
  settings,
  onUpdateSettings,
  showToast
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    settings.renderKeepAliveEnabled !== false
  );
  const [appUrl, setAppUrl] = useState<string>(
    settings.renderAppUrl || ''
  );
  const [intervalMinutes, setIntervalMinutes] = useState<number>(
    settings.renderPingIntervalMinutes || 9
  );
  const [stats, setStats] = useState<KeepAliveStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isTestingPing, setIsTestingPing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    durationMs: number;
    url: string;
    error?: string;
  } | null>(null);

  // Auto-detect current browser host as a suggestion if empty
  const detectedOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // Fetch current Keep-Alive Stats from Backend
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/keepalive');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          if (!appUrl && data.detectedRenderUrl) {
            setAppUrl(data.detectedRenderUrl);
          }
        }
      }
    } catch (err) {
      console.warn('Error cargando estadísticas de KeepAlive:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // refresh stats every 15s
    return () => clearInterval(interval);
  }, []);

  // Format seconds to readable uptime
  const formatUptime = (seconds: number) => {
    if (!seconds) return '0 min';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (parts.length === 0 || s > 0) parts.push(`${s}s`);
    return parts.join(' ');
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    const updatedSettings: StoreSettings = {
      ...settings,
      renderKeepAliveEnabled: isEnabled,
      renderAppUrl: appUrl.trim(),
      renderPingIntervalMinutes: intervalMinutes
    };

    onUpdateSettings(updatedSettings);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      showToast('¡Configuración de Anti-Suspensión Render guardada con éxito!');
      await fetchStats();
    } catch (err) {
      showToast('Configuración guardada localmente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPingNow = async () => {
    setIsTestingPing(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/keepalive/ping-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customUrl: appUrl.trim() || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTestResult(data.result);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.result.success) {
          showToast(`¡Ping exitoso a ${data.result.url} (${data.result.durationMs}ms)!`);
        } else {
          showToast(`El ping falló: ${data.result.error || 'Código ' + data.result.status}`);
        }
      } else {
        showToast('Error al ejecutar prueba de ping');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 0,
        durationMs: 0,
        url: appUrl || 'Localhost',
        error: err.message || 'Error de conexión'
      });
      showToast('Error de conexión al enviar ping');
    } finally {
      setIsTestingPing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`¡${label} copiado al portapapeles!`);
    }
  };

  const publicEndpointUrl = (appUrl.trim() || detectedOrigin).replace(/\/+$/, '') + '/api/keepalive';

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#171719] via-[#1a1c23] to-[#121b2b] p-6 sm:p-8 rounded-3xl border border-stone-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-lg shadow-inner">
                <i className="fa-solid fa-heart-pulse animate-pulse"></i>
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                  Render 24/7 Always-On
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Sistema Anti-Suspensión Automático
                </h2>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
              Mantiene tu servidor y botillería <strong>100% activa las 24 horas</strong>. Evita que Render desactive o suspenda la instancia por inactividad (spin-down de los 15 minutos), eliminando tiempos de espera para tus clientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="bg-[#ffd025] hover:bg-yellow-400 text-[#141414] font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg active:scale-95 shrink-0"
            >
              <i className={`fa-solid ${isSaving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
              <span>{isSaving ? 'Guardando...' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas y Estado en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#171719] p-4 rounded-2xl border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Estado 24/7</span>
            <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
          </div>
          <div className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
            {isEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <i className="fa-solid fa-circle-check text-xs"></i> Activo
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <i className="fa-solid fa-circle-xmark text-xs"></i> Pausado
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {isEnabled ? `Pulso cada ${intervalMinutes} min` : 'Sin auto-pulsos'}
          </p>
        </div>

        <div className="bg-[#171719] p-4 rounded-2xl border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Uptime Servidor</span>
            <i className="fa-solid fa-clock text-xs text-yellow-400"></i>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {stats ? formatUptime(stats.uptimeSeconds) : 'Iniciando...'}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">Tiempo continuo</p>
        </div>

        <div className="bg-[#171719] p-4 rounded-2xl border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pulsos Enviados</span>
            <i className="fa-solid fa-paper-plane text-xs text-cyan-400"></i>
          </div>
          <div className="text-base sm:text-lg font-black text-white">
            {stats?.totalPings || 0}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {stats ? `${stats.successfulPings} exitosos (${stats.failedPings} errores)` : '0 exitosos'}
          </p>
        </div>

        <div className="bg-[#171719] p-4 rounded-2xl border border-stone-800 shadow-md">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Última Respuesta</span>
            <i className="fa-solid fa-bolt text-xs text-emerald-400"></i>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate">
            {stats?.lastPingDurationMs !== null && stats?.lastPingDurationMs !== undefined
              ? `${stats.lastPingDurationMs} ms`
              : 'En espera'}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {stats?.lastPingResponseStatus ? `Código HTTP ${stats.lastPingResponseStatus}` : 'Listo'}
          </p>
        </div>
      </div>

      {/* Configuración Principal & Test */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Configuración (7 cols) */}
        <div className="lg:col-span-7 bg-[#171719] p-6 rounded-3xl border border-stone-800 shadow-xl space-y-5">
          <h3 className="text-sm font-black uppercase text-white flex items-center gap-2 pb-3 border-b border-stone-800">
            <i className="fa-solid fa-sliders text-[#ffd025]"></i> Parámetros de Anti-Suspensión
          </h3>

          {/* Switch Activar/Desactivar */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#121214] border border-stone-800">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-white block">
                Activar Heartbeat Continuo
              </label>
              <p className="text-[11px] text-stone-400">
                Envía peticiones automáticas de mantenimiento periódicamente.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* URL de Render */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                <i className="fa-solid fa-globe text-cyan-400"></i> URL Pública en Render (Recomendado)
              </label>
              {detectedOrigin && (
                <button
                  type="button"
                  onClick={() => setAppUrl(detectedOrigin)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  Usar actual: {detectedOrigin.replace(/https?:\/\//, '').slice(0, 25)}...
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
                placeholder="https://tu-tienda.onrender.com"
                className="w-full bg-[#121214] border border-stone-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-hidden transition"
              />
            </div>
            <p className="text-[11px] text-stone-400">
              Ingresa la URL pública asignada por Render. Si la dejas vacía, el servidor usará automáticamente la variable de entorno <code className="bg-stone-800 px-1 py-0.5 rounded text-cyan-300">RENDER_EXTERNAL_URL</code> o el host local.
            </p>
          </div>

          {/* Frecuencia de Ping */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
              <i className="fa-solid fa-stopwatch text-yellow-400"></i> Frecuencia del Pulso (Cada cuántos minutos)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 8, 9, 12].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setIntervalMinutes(min)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    intervalMinutes === min
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-sm'
                      : 'bg-[#121214] text-stone-400 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {min} min {min === 9 && <span className="text-[9px] block text-emerald-400 font-normal">Óptimo</span>}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400">
              Render suspende tras 15 minutos sin tráfico. Un pulso cada <strong>8 a 10 minutos</strong> garantiza que jamás entre en reposo.
            </p>
          </div>

          {/* Botón de Test */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestPingNow}
              disabled={isTestingPing}
              className="w-full bg-stone-800 hover:bg-stone-700 text-cyan-300 border border-stone-700 hover:border-cyan-400 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
            >
              <i className={`fa-solid ${isTestingPing ? 'fa-spinner fa-spin' : 'fa-radar'}`}></i>
              <span>{isTestingPing ? 'Enviando pulso de prueba...' : 'Probar Pulso (Ping Instantáneo)'}</span>
            </button>
          </div>

          {/* Resultado de la prueba */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs space-y-1 animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <i className={`fa-solid ${testResult.success ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                  {testResult.success ? '¡Prueba Exitosa!' : 'Prueba Fallida'}
                </span>
                <span>{testResult.durationMs} ms</span>
              </div>
              <p className="text-[11px] opacity-90 truncate">
                Destino: {testResult.url} (Código HTTP: {testResult.status || '0'})
              </p>
              {testResult.error && (
                <p className="text-[10px] text-rose-400 bg-rose-950/40 p-1.5 rounded-lg">
                  Detalle: {testResult.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Historial de Pulsos & Monitoreo Externo (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Historial de Pings */}
          <div className="bg-[#171719] p-5 rounded-3xl border border-stone-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <i className="fa-solid fa-list-check text-cyan-400"></i> Historial Reciente
              </h3>
              <button
                onClick={fetchStats}
                className="text-[10px] text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Refrescar historial"
              >
                <i className="fa-solid fa-arrows-rotate"></i> Actualizar
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {stats?.history && stats.history.length > 0 ? (
                stats.history.slice(0, 10).map((log: KeepAliveLog, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#121214] border border-stone-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${log.success ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                      <div className="min-w-0">
                        <p className="font-bold text-stone-200 truncate">
                          {log.status === 200 ? 'HTTP 200 OK' : `HTTP ${log.status}`}
                        </p>
                        <p className="text-[9px] text-stone-500">
                          {new Date(log.timestamp).toLocaleTimeString()} · {log.durationMs}ms
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded shrink-0">
                      Auto-Pulse
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-stone-500 text-xs">
                  <i className="fa-solid fa-satellite-dish text-stone-600 text-xl mb-1 block"></i>
                  Esperando el primer pulso automático...
                </div>
              )}
            </div>
          </div>

          {/* Respaldo Opcional con Monitor Externo */}
          <div className="bg-[#171719] p-5 rounded-3xl border border-stone-800 shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase text-white flex items-center gap-1.5">
              <i className="fa-solid fa-shield-halved text-emerald-400"></i> Respaldo Externo Gratuito (Opcional)
            </h3>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              Si deseas una doble capa de seguridad, puedes vincular tu URL en un servicio gratuito como <strong>Cron-Job.org</strong> o <strong>UptimeRobot</strong> para que también la visiten cada 10 minutos:
            </p>
            <div className="flex items-center gap-2 bg-[#121214] p-2 rounded-xl border border-stone-800">
              <input
                type="text"
                readOnly
                value={publicEndpointUrl}
                className="bg-transparent text-[11px] text-cyan-300 font-mono w-full focus:outline-hidden truncate"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(publicEndpointUrl, 'Endpoint')}
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-1.5 rounded-lg text-xs shrink-0 cursor-pointer"
                title="Copiar URL"
              >
                <i className="fa-solid fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
