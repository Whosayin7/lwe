import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

interface EncryptionChartProps {
  data: any[];
}

const EncryptionChart: React.FC<EncryptionChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
      <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">
        Kafes Gürültü Dağılımı (İlk 20 Bit)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="bitIndex"
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(val) => `B${val}`}
          />
          <YAxis stroke="#64748b" fontSize={12} domain={[0, 3500]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderColor: "#334155",
              color: "#f1f5f9",
            }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <ReferenceLine
            y={1664}
            label="Q/2"
            stroke="#ef4444"
            strokeDasharray="3 3"
          />
          <Bar dataKey="vPrime" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.originalBit === 1 ? "#22d3ee" : "#334155"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-6 mt-2 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-cyan-450 rounded-sm"></span> Bit 1 (Yüksek
          Enerji/Q/2)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-slate-700 rounded-sm"></span> Bit 0
          (Sadece Gürültü)
        </div>
      </div>
    </div>
  );
};

export default EncryptionChart;
