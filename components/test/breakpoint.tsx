export const BreakPointText = () => {
  return (
    <>
      <div className="hidden xs:hidden sm:hidden md:hidden lg:hidden xl:hidden 2xl:block">2 XL LARGE</div>
      <div className="hidden xs:hidden sm:hidden md:hidden lg:hidden xl:block 2xl:hidden">XL LARGE</div>
      <div className="hidden xs:hidden sm:hidden md:hidden lg:block xl:hidden 2xl:hidden">LARGE</div>
      <div className="hidden xs:hidden sm:hidden md:block lg:hidden xl:hidden 2xl:hidden">MEDIUM</div>
      <div className="hidden xs:hidden sm:block md:hidden lg:hidden xl:hidden 2xl:hidden">SMALL</div>
      <div className="hidden xs:block sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden">X SMALL</div>
      <div className="hidden xxs:block xs:hidden sm:hidden md:hidden lg:hidden xl:hidden 2xl:hidden">XX SMALL</div>
    </>
  );
};
