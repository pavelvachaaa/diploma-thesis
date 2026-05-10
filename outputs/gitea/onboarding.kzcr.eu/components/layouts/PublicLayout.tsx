import Footer from "../kzcr/footer";
import Header from "../kzcr/header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">

            <Header></Header>
            <div className="public-layout">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>

            <Footer></Footer>

        </div>
    );
}
