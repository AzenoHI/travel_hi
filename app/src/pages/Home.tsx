import TravelTimeForm from "../components/TravelTimeForm.tsx";

export default function Home() {
    const handleSubmit = (data: { date: Date | null; mode: "departure" | "arrival" }) => {
        console.log("Wybrano:", data);
    };


    return (
        <section>
            <TravelTimeForm onSubmit={handleSubmit}/>;
        </section>
    );
}