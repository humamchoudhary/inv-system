// components/DateDisplay.tsx
interface DateDisplayProps {
  date: Date | string;
  format?: "short" | "long" | "datetime";
}

export function DateDisplay({ date, format = "short" }: DateDisplayProps) {
  const dateObj = new Date(date);

  const formats = {
    short: dateObj.toLocaleDateString(),
    long: dateObj.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    datetime: dateObj.toLocaleString(),
  };

  return <span>{formats[format]}</span>;
}
