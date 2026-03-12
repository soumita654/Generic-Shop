import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingCart, User, LogOut, Package, Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("search", searchQuery.trim());
      navigate(`/?${nextParams.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 font-heading text-xl font-bold tracking-tight text-foreground">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <Package className="h-5 w-5" />
          </span>
          GenericShop
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-border/80 bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/35"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <WishlistButton />
              <CartButton />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 hover:text-primary">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="mr-2 h-4 w-4" /> Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/wishlist")}>
                    <Heart className="mr-2 h-4 w-4" /> Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" className="rounded-xl px-5 shadow-[0_10px_24px_-16px_hsl(var(--primary))]" onClick={() => navigate("/signup")}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function WishlistButton() {
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/wishlist")}>
      <Heart className="h-5 w-5" />
      {wishlistCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {wishlistCount}
        </span>
      )}
    </Button>
  );
}

function CartButton() {
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => navigate("/cart")}>
      <ShoppingCart className="h-5 w-5" />
      {cartCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {cartCount}
        </span>
      )}
    </Button>
  );
}
