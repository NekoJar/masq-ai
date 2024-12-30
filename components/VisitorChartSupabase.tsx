"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import axios from "axios";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import supabase from "./services/supabase.js";

type ViewOption =
  | "none"
  | "10min"
  | "30min"
  | "hourly"
  | "daily"
  | "monthly"
  | "yearly";

type Person = {
  created_at: string;
  using_masks: number;
  not_using_masks: number;
  totals: number[];
};

type AggregatedData = {
  date: string;
  using: number;
  not_using: number;
  total: number;
};

export function VisitorChartSupabase() {
  const [maskCounts, setMaskCounts] = React.useState<Person[]>([]);
  const [view, setView] = React.useState<ViewOption>("none");
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("using");
  const router = useRouter();

  React.useEffect(() => {
    const fetchMaskCounts = async () => {
      const { data, error } = await supabase.from("peoples").select("*");
      if (error) {
        console.error(error);
      } else {
        setMaskCounts(data);
      }
    };

    fetchMaskCounts();

    const channel = supabase
      .channel("realtime_peoples")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "peoples",
        },
        (payload) => {
          console.log("NYAHHAHA", payload);
          fetchMaskCounts(); // Fetch the updated data directly
          router.refresh(); // Refresh the router if needed
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const aggregateData = (
    data: Person[],
    view: ViewOption
  ): AggregatedData[] => {
    if (view === "none") {
      return data.map((person) => ({
        date: new Date(person.created_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        using: person.using_masks,
        not_using: person.not_using_masks,
        total: person.totals[0],
      }));
    }

    let filteredData = data;
    if (view === "10min" || view === "30min" || view === "hourly") {
      // Determine the most recent day
      const mostRecentDate = new Date(
        Math.max(...data.map((person) => new Date(person.created_at).getTime()))
      );
      const mostRecentDay = mostRecentDate.toISOString().split("T")[0];

      // Filter data to include only entries from the most recent day
      filteredData = data.filter(
        (person) => person.created_at.split("T")[0] === mostRecentDay
      );
    }

    const groupedData: { [key: string]: AggregatedData } = {};
    filteredData.forEach((person) => {
      const date = new Date(person.created_at);
      const key =
        view === "10min"
          ? `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()} ${date.getHours()}:${
              Math.floor(date.getMinutes() / 10) * 10
            }:00`
          : view === "30min"
          ? `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()} ${date.getHours()}:${
              Math.floor(date.getMinutes() / 30) * 30
            }:00`
          : view === "hourly"
          ? `${date.getFullYear()}-${
              date.getMonth() + 1
            }-${date.getDate()} ${date.getHours()}:00`
          : view === "monthly"
          ? `${date.getFullYear()}-${date.getMonth() + 1}`
          : view === "yearly"
          ? `${date.getFullYear()}`
          : date.toLocaleDateString("en-US");

      if (!groupedData[key]) {
        groupedData[key] = { date: key, using: 0, not_using: 0, total: 0 };
      }
      groupedData[key].using += person.using_masks;
      groupedData[key].not_using += person.not_using_masks;
      groupedData[key].total = person.totals[0];
    });
    return Object.values(groupedData);
  };

  const chartDataWithTotal = React.useMemo(
    () => aggregateData(maskCounts, view),
    [maskCounts, view]
  );

  const chartConfig = {
    views: {
      label: "Peoples",
    },
    using: {
      label: "Using",
      color: "black",
    },
    not_using: {
      label: "Not Using",
      color: "gray",
    },
    total: {
      label: "Total",
      color: "black",
    },
  } satisfies ChartConfig;

  const totalPerCategory = React.useMemo(() => {
    const formatter = new Intl.NumberFormat("en-US"); // Ensure consistent formatting
    const totalUsing = chartDataWithTotal.reduce(
      (acc, curr) => acc + curr.using,
      0
    );
    const totalNotUsing = chartDataWithTotal.reduce(
      (acc, curr) => acc + curr.not_using,
      0
    );
    const totalPeople = chartDataWithTotal.reduce(
      (acc, curr) => acc + curr.total,
      0
    );
    return {
      using: formatter.format(totalUsing),
      not_using: formatter.format(totalNotUsing),
      total: formatter.format(totalPeople),
    };
  }, [chartDataWithTotal]);

  return (
    <>
      <div className="flex items-center justify-center xl:justify-end ">
        <Select onValueChange={(value) => setView(value as ViewOption)}>
          <SelectTrigger className="w-[90vw] xl:w-[10vw]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>View Options</SelectLabel>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="10min">Every 10 Minutes</SelectItem>
              <SelectItem value="30min">Every 30 Minutes</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Bar Chart</CardTitle>
            <CardDescription>
              Showing total visitors for the last 3 months
            </CardDescription>
          </div>
          <div className="flex">
            {["using", "not_using", "total"].map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="relative z-30 flex flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-10 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-lg font-bold leading-none xl:text-3xl">
                    {totalPerCategory[
                      key as keyof typeof totalPerCategory
                    ].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[40vh] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartDataWithTotal}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return view === "none"
                    ? value
                    : view === "10min" || view === "30min" || view === "hourly"
                    ? `${date.getHours()}:${date
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")}`
                    : view === "daily"
                    ? date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : view === "monthly"
                    ? `${date.getFullYear()}-${date.getMonth() + 1}`
                    : view === "yearly"
                    ? date.getFullYear().toString()
                    : date.toLocaleString();
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return view === "none"
                        ? value
                        : new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                    }}
                  />
                }
              />
              <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  );
}
