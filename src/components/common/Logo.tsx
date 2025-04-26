
const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <img 
      src="/lovable-uploads/116f9f55-b3b3-47e6-adbb-b545c36f2d2e.png" 
      alt="Application Logo" 
      className={`h-8 w-auto ${className}`}
    />
  );
};

export default Logo;
