import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center p-10 md:p-14 glass-card rounded-3xl border border-dashed border-border/80 bg-card/10 max-w-md mx-auto shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)]"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner relative group-hover:scale-105 transition-all">
        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-lg" />
        <Icon className="w-7 h-7 relative z-10" />
      </div>
      <h3 className="text-lg font-extrabold text-foreground mb-2.5 tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground font-semibold max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
