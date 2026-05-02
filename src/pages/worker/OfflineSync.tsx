import { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { Button } from '../../components/ui/button';
import { cn } from '../../utils';

export function OfflineSync() {
  const { t } = useTranslation();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [pendingChanges, setPendingChanges] = useState(3); // Mock data

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate network request
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync(new Date());
      setPendingChanges(0);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-[1.1rem] bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <WifiOff size={22} />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Offline Sync</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your local data and sync with the main server when connected.
                </p>
              </div>
            </div>
          </div>
          <Button
            className="rounded-2xl px-5 py-3 text-sm font-semibold"
            onClick={handleSync}
            disabled={isSyncing || pendingChanges === 0}
          >
            <RefreshCw size={16} className={cn("mr-2", isSyncing && "animate-spin")} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
           <h3 className="text-lg font-semibold text-foreground mb-4">Sync Status</h3>
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                  <div className="flex items-center gap-3">
                     <Clock className="text-muted-foreground" size={20} />
                     <div>
                        <p className="text-sm font-medium text-foreground">Last Synced</p>
                        <p className="text-xs text-muted-foreground">{lastSync.toLocaleString()}</p>
                     </div>
                  </div>
              </div>
               <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                  <div className="flex items-center gap-3">
                     <RefreshCw className="text-muted-foreground" size={20} />
                     <div>
                        <p className="text-sm font-medium text-foreground">Pending Changes</p>
                        <p className="text-xs text-muted-foreground">{pendingChanges} updates waiting</p>
                     </div>
                  </div>
                   {pendingChanges > 0 ? (
                       <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                           {pendingChanges}
                       </span>
                   ) : (
                       <CheckCircle2 className="text-emerald-500" size={20} />
                   )}
              </div>
           </div>
        </div>

        {/* Network Info Card */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
           <h3 className="text-lg font-semibold text-foreground mb-4">Connection Info</h3>
           <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-emerald-100 p-4 dark:bg-emerald-950/40">
                  <Wifi className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-lg font-medium text-foreground">Connected to Network</h4>
              <p className="mt-2 text-sm text-muted-foreground max-w-[250px]">
                 You are currently online. Any pending changes can be synced to the server now.
              </p>
           </div>
        </div>
      </section>
    </div>
  );
}
