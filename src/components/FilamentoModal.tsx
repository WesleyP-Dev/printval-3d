import React, { useState, useEffect } from 'react';
import { X, Star, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Filamento, TipoMaterial } from '../types';
import { formatarMoeda } from '../utils/pdfGenerator';

interface FilamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  filamentoParaEditar?: Filamento | null;
  onSalvar: (filamento: Filamento) => void;
}

const TIPOS_DISPONIVEIS: TipoMaterial[] = ['PLA', 'PETG', 'ABS', 'TPU', 'ASA', 'Resina', 'Outro'];

export const FilamentoModal: React.FC<FilamentoModalProps> = ({
  isOpen,
  onClose,
  filamentoParaEditar,
  onSalvar,
}) => {
  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [tipo, setTipo] = useState<TipoMaterial>('PLA');
  const [corHex, setCorHex] = useState('#1E1E24');
  const [corNome, setCorNome] = useState('');
  const [pesoTotalGramas, setPesoTotalGramas] = useState(1000);
  const [pesoRestanteGramas, setPesoRestanteGramas] = useState(1000);
  const [precoAtual, setPrecoAtual] = useState(120.0);
  const [fatorQualidadeRisco, setFatorQualidadeRisco] = useState(1.0);
  const [favorito, setFavorito] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'historico'>('dados');

  useEffect(() => {
    if (filamentoParaEditar) {
      setNome(filamentoParaEditar.nome);
      setMarca(filamentoParaEditar.marca);
      setTipo(filamentoParaEditar.tipo);
      setCorHex(filamentoParaEditar.corHex);
      setCorNome(filamentoParaEditar.corNome);
      setPesoTotalGramas(filamentoParaEditar.pesoTotalGramas);
      setPesoRestanteGramas(filamentoParaEditar.pesoRestanteGramas);
      setPrecoAtual(filamentoParaEditar.precoAtual);
      setFatorQualidadeRisco(filamentoParaEditar.fatorQualidadeRisco);
      setFavorito(filamentoParaEditar.favorito);
    } else {
      setNome('');
      setMarca('');
      setTipo('PLA');
      setCorHex('#10b981');
      setCorNome('Verde Esmeralda');
      setPesoTotalGramas(1000);
      setPesoRestanteGramas(1000);
      setPrecoAtual(125.0);
      setFatorQualidadeRisco(1.0);
      setFavorito(false);
      setAbaAtiva('dados');
    }
  }, [filamentoParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const agora = new Date().toISOString().slice(0, 10);
    let historico = filamentoParaEditar?.historicoPreco ? [...filamentoParaEditar.historicoPreco] : [];

    // Se o preço foi alterado ou é novo, adiciona registro no histórico
    if (
      !filamentoParaEditar ||
      filamentoParaEditar.precoAtual !== Number(precoAtual) ||
      historico.length === 0
    ) {
      historico.push({
        data: agora,
        preco: Number(precoAtual),
      });
    }

    const filamentoSalvo: Filamento = {
      id: filamentoParaEditar ? filamentoParaEditar.id : `fil-${Date.now()}`,
      nome: nome.trim() || 'Filamento Sem Nome',
      marca: marca.trim() || 'Genérica',
      tipo,
      corHex,
      corNome: corNome.trim() || 'Cor Padrão',
      pesoTotalGramas: Number(pesoTotalGramas) || 1000,
      pesoRestanteGramas: Math.min(Number(pesoTotalGramas), Math.max(0, Number(pesoRestanteGramas))),
      precoAtual: Number(precoAtual) || 0,
      fatorQualidadeRisco: Number(fatorQualidadeRisco) || 1.0,
      favorito,
      historicoPreco: historico,
    };

    onSalvar(filamentoSalvo);
    onClose();
  };

  const historicoData = filamentoParaEditar?.historicoPreco || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {filamentoParaEditar ? 'Editar Carretel de Filamento' : 'Novo Carretel de Filamento'}
            </h3>
            <button
              type="button"
              onClick={() => setFavorito(!favorito)}
              className={`p-1 rounded-full transition-colors ${
                favorito ? 'text-amber-400' : 'text-slate-300 hover:text-slate-400'
              }`}
              title={favorito ? 'Favorito' : 'Marcar como favorito'}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas caso esteja editando para ver o gráfico */}
        {filamentoParaEditar && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
            <button
              onClick={() => setAbaAtiva('dados')}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-all ${
                abaAtiva === 'dados'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Dados do Carretel
            </button>
            <button
              onClick={() => setAbaAtiva('historico')}
              className={`pb-2 px-3 text-sm font-semibold border-b-2 transition-all ${
                abaAtiva === 'historico'
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Histórico de Preços ({historicoData.length})
            </button>
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {abaAtiva === 'historico' && filamentoParaEditar ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Oscilação Histórica do Preço do Carretel (R$)
                </h4>
                {historicoData.length > 1 ? (
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicoData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} tickFormatter={(v) => `R$${v}`} />
                        <Tooltip
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          formatter={(value: any) => [formatarMoeda(Number(value)), 'Preço']}
                          labelFormatter={(l) => `Data: ${l}`}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="preco"
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#0ea5e9', strokeWidth: 2, stroke: '#ffffff' }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Apenas 1 registro de preço cadastrado ({formatarMoeda(filamentoParaEditar.precoAtual)}). O gráfico será desenhado à medida que novas alterações forem salvas.
                  </div>
                )}
              </div>

              {/* Lista dos registros */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 uppercase">
                    <tr>
                      <th className="px-4 py-2">Data do Registro</th>
                      <th className="px-4 py-2 text-right">Preço Registrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {historicoData.map((h, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2 font-mono text-xs">{h.data}</td>
                        <td className="px-4 py-2 text-right font-bold text-slate-800 dark:text-slate-100">
                          {formatarMoeda(h.preco)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Nome Comercial do Filamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Preto Fosco Alta Precisão"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Marca / Fabricante *
                  </label>
                  <input
                    type="text"
                    required
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ex: eSun, Voolt3D, Prusament"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                {/* Tipo de Material */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Material *
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoMaterial)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  >
                    {TIPOS_DISPONIVEIS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Seletor de Cor com Preview Interativo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Cor Visual (Preview)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={corHex}
                      onChange={(e) => setCorHex(e.target.value)}
                      className="w-10 h-10 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={corHex}
                      onChange={(e) => setCorHex(e.target.value)}
                      className="w-28 px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs uppercase"
                    />
                    <div
                      className="w-8 h-8 rounded-full border shadow-inner"
                      style={{ backgroundColor: corHex }}
                    />
                  </div>
                </div>

                {/* Nome da Cor */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Nome da Cor *
                  </label>
                  <input
                    type="text"
                    required
                    value={corNome}
                    onChange={(e) => setCorNome(e.target.value)}
                    placeholder="Ex: Azul Royal, Preto Fosco"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                {/* Preço Atual do Carretel */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Preço do Carretel (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={precoAtual}
                    onChange={(e) => setPrecoAtual(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                {/* Fator de Qualidade / Risco */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Fator Qualidade/Risco
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="3.0"
                      value={fatorQualidadeRisco}
                      onChange={(e) => setFatorQualidadeRisco(parseFloat(e.target.value) || 1.0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                    />
                    <span className="text-xs text-slate-500" title="1.0 = Normal | 1.25+ = Materiais técnicos, lentos ou sujeitos a falha">
                      x
                    </span>
                  </div>
                </div>

                {/* Peso Total (g) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Capacidade Total (g)
                  </label>
                  <input
                    type="number"
                    step="50"
                    min="100"
                    value={pesoTotalGramas}
                    onChange={(e) => setPesoTotalGramas(parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>

                {/* Peso Restante (g) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Saldo Restante no Carretel (g) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    max={pesoTotalGramas}
                    value={pesoRestanteGramas}
                    onChange={(e) => setPesoRestanteGramas(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 text-sm"
                  />
                </div>
              </div>

              {/* Indicador de Nível do Carretel em Tempo Real */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                  <span>Preenchimento do Carretel:</span>
                  <span>
                    {pesoRestanteGramas}g / {pesoTotalGramas}g (
                    {Math.round((pesoRestanteGramas / (pesoTotalGramas || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pesoRestanteGramas / pesoTotalGramas > 0.4
                        ? 'bg-emerald-500'
                        : pesoRestanteGramas / pesoTotalGramas > 0.2
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, (pesoRestanteGramas / pesoTotalGramas) * 100))}%`,
                    }}
                  />
                </div>
                {pesoRestanteGramas < 200 && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center space-x-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Atenção: Saldo de carretel baixo para impressões grandes!</span>
                  </p>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20 transition-all"
                >
                  {filamentoParaEditar ? 'Atualizar Carretel' : 'Cadastrar Carretel'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
