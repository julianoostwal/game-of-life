"use client";
import Meteors from "@/components/magicui/meteors";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Home() {
    return (
        <main className="bg-center bg-cover mx-auto p-4  min-h-screen bg-gradient-to-r from-sky-700 to-sky-900">
            <div className="animate-jump-in animate-delay-500">
                <Image
                    src={"spaceship.svg"}
                    width={300}
                    height={300}
                    alt={"a"}
                />
            </div>
            <Meteors number={30} />

            <div className="flex items-center justify-center position: relative">
                <div className="flex flex-col items-center animate-jump-in animate-delay-1000">
                    <p className="text-5xl mb-8 protest-guerrilla-regular text-center">
                        Game Of Life
                    </p>
                    <Button variant={"destructive"} className="text-5xl p-12">
                        Play!
                    </Button>
                </div>
            </div>

        </main>

    );
}
