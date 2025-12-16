import React, { useState, useEffect } from "react";
import { generateKeys, encryptText, decryptText } from "./lweService";
import { KeyPair } from "./types";
import EncryptionChart from "./EncryptionChart";
import {
  LockClosedIcon,
  KeyIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const App: React.FC = () => {
  // State
  const [keys, setKeys] = useState<KeyPair | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputMessage, setInputMessage] = useState(
    "Merhaba! Bu güvenli bir LWE mesajıdır."
  );
  const [ciphertext, setCiphertext] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [encryptionStats, setEncryptionStats] = useState<any[]>([]);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"encrypt" | "decrypt">("encrypt");

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    // Add artificial delay for visual feedback of "heavy computation"
    try {
      const newKeys = await generateKeys();
      setKeys(newKeys);
      setCiphertext("");
      setDecryptedText("");
      setEncryptionStats([]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEncrypt = () => {
    if (!keys || !inputMessage) return;
    try {
      const result = encryptText(keys.pk, inputMessage);
      setCiphertext(result.ciphertext);
      setEncryptionStats(result.stats);
      setDecryptedText(""); // clear previous decryption
    } catch (e) {
      console.error("Encryption error", e);
    }
  };

  const handleDecrypt = () => {
    if (!keys || !ciphertext) return;
    setDecryptError(null);
    try {
      const result = decryptText(keys.sk, ciphertext);
      setDecryptedText(result);
    } catch (e) {
      setDecryptError("Şifre Çözme Hatası: Geçersiz anahtar veya bozuk veri.");
      setDecryptedText("");
    }
  };

  // Auto-encrypt when keys are generated for better UX
  useEffect(() => {
    if (keys && inputMessage && !ciphertext) {
      handleEncrypt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                LWE Kripto Stüdyosu
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Kafes Tabanlı Şifreleme Protokolü
              </p>
            </div>
          </div>
          <div className="flex gap-2 text-xs font-mono text-slate-500">
            <span>Q=3329</span>
            <span>•</span>
            <span>N=128</span>
            <span>•</span>
            <span>M=256</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Key Generation Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl shadow-black/20">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <KeyIcon className="w-4 h-4" /> Güvenlik Bağlamı
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Hatalarla Öğrenme (LWE) problemine dayalı kuantum dirençli bir
                anahtar çifti oluşturun. Anahtarlar, gürültü enjekte edilmiş
                büyük matrisler kullanır.
              </p>

              <button
                onClick={handleGenerateKeys}
                disabled={isGenerating}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    isGenerating
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20"
                  }`}
              >
                {isGenerating ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />{" "}
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <KeyIcon className="w-5 h-5" /> Anahtar Oluştur
                  </>
                )}
              </button>

              {keys && (
                <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="p-3 bg-slate-950/50 rounded border border-slate-800/50">
                    <div className="text-xs text-cyan-400 font-mono mb-1">
                      Genel Anahtar Özeti (Public Key)
                    </div>
                    <div className="text-xs text-slate-500 break-all font-mono">
                      {keys.pk.b.slice(0, 10).join("")}...
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded border border-slate-800/50">
                    <div className="text-xs text-red-400 font-mono mb-1">
                      Gizli Anahtar Özeti (Secret Key)
                    </div>
                    <div className="text-xs text-slate-500 break-all font-mono">
                      ********************
                    </div>
                  </div>
                  <div className="text-xs text-green-500 flex items-center gap-1">
                    <ShieldCheckIcon className="w-3 h-3" /> Güvenli bağlantı
                    kuruldu
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {!keys ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-slate-600">
                <LockClosedIcon className="w-12 h-12 mb-4 opacity-50" />
                <p>Güvenli iletişime başlamak için anahtar oluşturun</p>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab("encrypt")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2
                      ${
                        activeTab === "encrypt"
                          ? "border-cyan-500 text-cyan-400 bg-slate-800/30"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                      }`}
                  >
                    Şifreleme (Encryption)
                  </button>
                  <button
                    onClick={() => setActiveTab("decrypt")}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2
                      ${
                        activeTab === "decrypt"
                          ? "border-cyan-500 text-cyan-400 bg-slate-800/30"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                      }`}
                  >
                    Şifre Çözme (Decryption)
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col gap-6">
                  {/* Encrypt View */}
                  {activeTab === "encrypt" && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2">
                          DÜZ METİN MESAJ
                        </label>
                        <div className="relative">
                          <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-mono focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-200 placeholder-slate-600 h-24 resize-none transition-all"
                            placeholder="Gizli mesajınızı buraya yazın..."
                          />
                          <button
                            onClick={handleEncrypt}
                            className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                          >
                            Veriyi Şifrele
                          </button>
                        </div>
                      </div>

                      {ciphertext && (
                        <>
                          <div>
                            <label className="block text-xs font-mono text-slate-400 mb-2 flex justify-between">
                              <span>ŞİFRELİ METİN (BASE64)</span>
                              <span className="text-cyan-500">
                                {(ciphertext.length / 1024).toFixed(2)} KB
                              </span>
                            </label>
                            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-24 overflow-y-auto custom-scrollbar">
                              <code className="text-xs text-slate-400 break-all leading-relaxed">
                                {ciphertext}
                              </code>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-800/50">
                            <EncryptionChart data={encryptionStats} />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Decrypt View */}
                  {activeTab === "decrypt" && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-2">
                          ŞİFRELENMİŞ VERİ
                        </label>
                        <div className="relative">
                          <textarea
                            value={ciphertext}
                            onChange={(e) => setCiphertext(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm font-mono focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none text-slate-400 placeholder-slate-700 h-32 resize-none transition-all"
                            placeholder="Şifreli Base64 metnini buraya yapıştırın..."
                          />
                          <button
                            onClick={handleDecrypt}
                            className="absolute bottom-3 right-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded transition-colors"
                          >
                            Şifreyi Çöz
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-4 min-h-[100px] flex flex-col justify-center">
                        <label className="block text-xs font-mono text-slate-500 mb-2">
                          ÇÖZÜLMÜŞ ÇIKTI
                        </label>
                        {decryptError ? (
                          <div className="text-red-400 text-sm flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>{" "}
                            {decryptError}
                          </div>
                        ) : decryptedText ? (
                          <div className="text-cyan-300 font-mono text-lg animate-in fade-in slide-in-from-left-2">
                            {decryptedText}
                          </div>
                        ) : (
                          <div className="text-slate-600 text-sm italic">
                            Girdi bekleniyor...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Info Footer */}
        <section className="border-t border-slate-800 pt-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-slate-200 font-semibold mb-2">
                Nasıl Çalışır?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Bu uygulama <strong>Regev LWE</strong> kripto sistemini uygular.
                Faktoring veya ayrık logaritmalara dayanan RSA veya ECC'nin
                aksine, LWE, gürültü eklenmiş yüksek boyutlu bir kafeste bir
                vektör bulmanın zorluğuna dayanır. Bu, onu Kuantum Bilgisayar
                saldırılarına (Shor Algoritması) karşı dirençli kılar.
              </p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <h4 className="text-xs font-mono text-slate-500 mb-2">
                MATEMATİKSEL TEMELLER
              </h4>
              <ul className="space-y-2 text-sm text-slate-300 font-mono">
                <li className="flex justify-between">
                  <span>KeyGen:</span> <span>b = As + e (mod q)</span>
                </li>
                <li className="flex justify-between">
                  <span>Encrypt:</span>{" "}
                  <span>(u, v) = (Aᵀr, bᵀr + m⌊q/2⌋)</span>
                </li>
                <li className="flex justify-between">
                  <span>Decrypt:</span> <span>d ≈ v - sᵀu</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
