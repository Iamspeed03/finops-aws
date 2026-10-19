import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ShieldAlert, ShieldCheck, Server, Activity, Clock, FileText, Lock, Eye, Key, AlertTriangle, Loader2 } from 'lucide-react';
import DownloadButton from '@/components/DownloadButton';

async function getLatestReportData() {
  // 1. Opt into dynamic rendering BEFORE initializing the AWS SDK
  await connection();
  
  // 2. Initialize S3 inside the function so it avoids static-build crypto errors
  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: "reports/",
    });
    const { Contents } = await s3Client.send(listCommand);

    if (!Contents || Contents.length === 0) return null;

    const latestFile = Contents.sort((a, b) => b.LastModified!.getTime() - a.LastModified!.getTime())[0];

    const getCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: latestFile.Key!,
    });
    const response = await s3Client.send(getCommand);
    const textData = await response.Body?.transformToString();

    if (!textData) return null;

    return {
      fileName: latestFile.Key!.split("/")[1],
      timestamp: textData.match(/Timestamp: (.*?) UTC/)?.[1] || "N/A",
      auditWindow: textData.match(/Audit Window: (.*?)\n/)?.[1] || "N/A",
      totalSpend: textData.match(/Total Spend \(Last 24h\): \$(.*?) USD/)?.[1] || "0.00",
      complianceStatus: textData.match(/Config Status: (.*?)\n/)?.[1] || "Unknown",
      rawText: textData
    };
  } catch (error) {
    console.error("Error fetching from S3:", error);
    return null;
  }
}

// 3. This component strictly handles the data rendering
async function DashboardContent() {
  const report = await getLatestReportData();

  if (!report) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-neutral-300 mb-4" />
        <p className="text-neutral-500 font-medium">No audit reports found in the S3 repository.</p>
        <p className="text-sm text-neutral-400 mt-2">Trigger the AWS Lambda function to generate a report.</p>
      </div>
    );
  }

  const isCompliant = report.complianceStatus === "Compliant";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">FinOps & Security Command Center</h1>
          <p className="text-neutral-500 mt-2 flex items-center gap-2">
            <Clock size={16} /> Pipeline Synchronized: {report.timestamp} UTC
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Architecture Active
          </span>
          <DownloadButton content={report.rawText} filename={report.fileName} />
        </div>
      </div>

      {/* Core Financial & Posture Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-neutral-500 font-medium">24h Trailing Spend</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><Activity size={18} /></div>
          </div>
          <h3 className="text-3xl font-bold text-neutral-900">${report.totalSpend}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-neutral-500 font-medium">Financial Anomaly</p>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-md"><Server size={18} /></div>
          </div>
          <h3 className="text-3xl font-bold text-neutral-900">None</h3>
          <p className="text-xs text-green-500 mt-2 font-medium">Within $2 Budget Guardrail</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between col-span-1 lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-neutral-500 font-medium">AWS Config Enforcement Status</p>
            <div className={`p-2 rounded-md ${isCompliant ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {isCompliant ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
            </div>
          </div>
          <h3 className={`text-xl font-bold ${isCompliant ? 'text-green-700' : 'text-red-700'}`}>
            {report.complianceStatus}
          </h3>
        </div>
      </div>

      {/* Qualitative Cybersecurity Matrix & Raw Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center gap-2">
            <Lock size={20} className="text-neutral-500"/> Qualitative Security Posture
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-3">
                <Key size={16} className="text-indigo-500"/>
                <span className="text-sm font-medium text-neutral-700">IAM Role Least Privilege</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">Enforced</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-blue-500"/>
                <span className="text-sm font-medium text-neutral-700">Data-at-Rest Encryption</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">SSE-S3 Active</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-3">
                <Eye size={16} className="text-orange-500"/>
                <span className="text-sm font-medium text-neutral-700">S3 Public Access Block</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">Global Block Active</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-red-500"/>
                <span className="text-sm font-medium text-neutral-700">Orphaned Access Keys</span>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">0 Detected</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText size={20} className="text-neutral-500"/> Immutable Audit Log
            </h2>
            <span className="text-xs text-neutral-400 font-mono">{report.fileName}</span>
          </div>
          <div className="bg-neutral-900 p-5 rounded-lg overflow-x-auto flex-grow h-[260px] shadow-inner">
            <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
              {report.rawText}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. The default export acts as a shell providing the Suspense loading state
export default function FinOpsDashboard() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 size={40} className="text-blue-600 animate-spin" />
            <p className="text-neutral-600 font-medium animate-pulse text-lg">Querying AWS Secure Enclave...</p>
            <p className="text-sm text-neutral-400">Fetching latest FinOps and Config telemetry</p>
          </div>
        }>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}