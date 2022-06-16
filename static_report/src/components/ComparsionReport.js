import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Code,
  Divider,
  Flex,
  Grid,
  Heading,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { nanoid } from "nanoid";
import { useEffect, useRef } from "react";

import { Main } from "./Main";
import { drawComparsionChart } from "../utils";
import { fill, zip } from "lodash";

function joinBykey(left, right) {
  const result = {};

  Object.entries(left).map(([key, value]) => {
    if (!result[key]) {
      result[key] = {};
    }

    result[key].left = value;
  });

  Object.entries(right).map(([key, value]) => {
    if (!result[key]) {
      result[key] = {};
    }
    result[key].right = value;
  });

  return result;
}

function format_time(time) {
  return format(new Date(time), "yyyy/MM/dd HH:mm:ss");
}

function CompareTest({ base, input }) {
  return (
    <TableContainer>
      <Table variant={"simple"}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Level</Th>
            <Th>Assertion</Th>
            <Th>Base Status</Th>
            <Th>Input Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td>price</Td>
            <Td>Table</Td>
            <Td>row_count</Td>
            <Td>
              <Text as="span" role={"img"}>
                ❌
              </Text>
            </Td>
            <Td>
              <Text as="span" role={"img"}>
                ✅
              </Text>
            </Td>
          </Tr>
          <Tr>
            <Td>open</Td>
            <Td>Column</Td>
            <Td>column_count</Td>
            <Td>
              <Text as="span" role={"img"}>
                -
              </Text>
            </Td>
            <Td>
              <Text as="span" role={"img"}>
                ✅
              </Text>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function CompareSchema({ base, input }) {
  return (
    <Accordion allowToggle>
      <AccordionItem borderColor={"transparent"}>
        <AccordionButton px={0} _focus={{ boxShadow: "transparent" }}>
          Added:
          <Text as={"span"} fontWeight={700} ml={1}>
            0
          </Text>
          , Deleted:
          <Text as={"span"} fontWeight={700} ml={1}>
            0
          </Text>
          , Changed:{" "}
          <Text as={"span"} fontWeight={700} ml={1}>
            0
          </Text>
          <Box flex="1" textAlign="left" />
          <AccordionIcon />
        </AccordionButton>

        <AccordionPanel px={0}>
          <Flex width={"100%"} justifyContent={"space-evenly"}>
            <TableContainer>
              <Table variant="simple" width={"350px"}>
                <Thead>
                  <Tr>
                    <Th>Column</Th>
                    <Th>Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(base.columns).map(([_, column]) => (
                    <Tr
                      key={nanoid(10)}
                      color={column.changed ? "red.500" : "inherit"}
                    >
                      <Td>{column.name ?? "-"}</Td>
                      <Td>{column.schema_type ?? "-"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>

            <Flex justifyContent={"center"}>
              <Divider orientation={"vertical"} />
            </Flex>

            <TableContainer>
              <Table variant="simple" width={"350px"}>
                <Thead>
                  <Tr>
                    <Th>Column</Th>
                    <Th>Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Object.entries(input.columns).map(([_, column]) => (
                    <Tr
                      key={nanoid(10)}
                      color={column.changed ? "red.500" : "inherit"}
                    >
                      <Td>{column.name ?? "-"}</Td>
                      <Td>{column.schema_type ?? "-"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Flex>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

function CompareProfileColumn({ name, base, input }) {
  let column = base;
  const isAllValuesExists = false;

  const MetricRow = ({ name, base, input }) => (
    <Flex gap="2">
      <Box flex="1">{<b>{name}</b>}</Box>
      <Flex justifyContent={"flex-end"} alignItems={"center"} w="100px">
        {base}
      </Flex>
      <Flex justifyContent={"flex-end"} alignItems={"center"} w="100px">
        {input}
      </Flex>
    </Flex>
  );

  const Missing = ({ column }) =>
    (Number((column.total - column.non_nulls) / column.total) * 100).toFixed(
      1
    ) + "%";

  const metrics = (
    <>
      <MetricRow
        name={
          <Text>
            <Text
              as={"span"}
              fontWeight={700}
              color={"gray.900"}
              fontSize={"xl"}
              mr={1}
            >
              {column.name}
            </Text>
            {""}(<Code>{column.type}</Code>)
          </Text>
        }
        base="Base"
        input="Input"
      ></MetricRow>

      <MetricRow name="Total" base={base.total} input={input.total}></MetricRow>
      <MetricRow
        name="Missing"
        base={<Missing column={base} />}
        input={<Missing column={input} />}
      ></MetricRow>
      <MetricRow
        name="Distinct"
        base={base.distinct}
        input={input.distinct}
      ></MetricRow>
      <Box height={2}></Box>

      {column.type === "numeric" && (
        <>
          <MetricRow
            name="Min"
            base={Number(input.min).toFixed(3)}
            input={Number(base.min).toFixed(3)}
          ></MetricRow>
          <MetricRow
            name="Max"
            base={Number(input.max).toFixed(3)}
            input={Number(base.max).toFixed(3)}
          ></MetricRow>
          <MetricRow
            name="Average"
            base={Number(input.avg).toFixed(3)}
            input={Number(base.avg).toFixed(3)}
          ></MetricRow>
        </>
      )}

      {column.type === "datetime" && (
        <>
          <MetricRow name="Min" base={input.max} input={base.max}></MetricRow>
          <MetricRow name="Max" base={input.max} input={base.max}></MetricRow>
        </>
      )}
    </>
  );

  // distribution
  let CompareDistribution;

  if (
    base.type === input.type &&
    (base.type == "string" || base.type == "datetime")
  ) {
    const transformDist = (base, input) => {
      let i = 0;
      let mapIndex = {};
      let result = [];

      for (i = 0; i < base.labels.length; i++) {
        let label = base.labels[i];
        let count = base.counts[i];
        mapIndex[label] = i;
        result.push({
          label: label,
          base: count,
          input: 0,
        });
      }

      for (i = 0; i < input.labels.length; i++) {
        let label = input.labels[i];
        let count = input.counts[i];

        if (mapIndex.hasOwnProperty(label)) {
          result[mapIndex[label]].input = count;
        } else {
          result.push({
            label: label,
            base: 0,
            input: count,
          });
        }
      }

      return result;
    };

    let data = transformDist(base.distribution, input.distribution);

    CompareDistribution = () => <ComparisonBarChart data={data} />;
  } else {
    const transformDist = (labels, base, input) => {
      if (!base) {
        base = fill(Array(labels.length), 0);
      }

      if (!input) {
        input = fill(Array(labels.length), 0);
      }

      let z = zip(labels, base, input);
      let m = z.map(([label, base, input]) => ({
        label,
        base,
        input,
      }));

      return m;
    };

    let dataBase = transformDist(
      base.distribution.labels,
      base.distribution.counts,
      null
    );
    let dataInput = transformDist(
      input.distribution.labels,
      null,
      input.distribution.counts
    );

    CompareDistribution = () => (
      <Grid my={4} templateColumns="1fr 1fr" gap={3}>
        <ComparisonBarChart data={dataBase} />
        <ComparisonBarChart data={dataInput} />
      </Grid>
    );
  }
  return (
    <Flex key={name} direction={"column"}>
      <Grid my={4} templateColumns="1fr 600px" gap={3}>
        <Flex direction={"column"} gap={1}>
          {metrics}
        </Flex>
        <CompareDistribution />
      </Grid>
    </Flex>
  );
}

function CompareProfile({ base, input }) {
  let transformedData = joinBykey(base.columns, input.columns);

  return (
    <>
      {Object.entries(transformedData).map(([key, value]) => {
        return (
          <CompareProfileColumn
            name={key}
            base={value.left}
            input={value.right}
          />
        );
      })}
    </>
  );
}

export function ComparisonReportMain({ base, input }) {
  return (
    <Main>
      <Flex direction={"column"} minH={"100vh"} width={"100%"}>
        <Flex
          border={"1px solid"}
          borderColor={"gray.300"}
          bg={"white"}
          borderRadius={"md"}
          p={6}
          my={10}
          mx={"10%"}
          direction={"column"}
          gap={8}
        >
          <Heading>Comparison Summary</Heading>

          {/* overview */}
          <Heading fontSize={24}>Overview</Heading>
          <TableContainer>
            <Table variant={"simple"}>
              <Thead>
                <Tr>
                  <Th width={"10%"} />
                  <Th width={"45%"}>Base</Th>
                  <Th width={"45%"}>Input</Th>
                </Tr>
              </Thead>

              <Tbody>
                <Tr>
                  <Td>Tables</Td>
                  <Td>
                    {base.name} at {format_time(base.created_at)}
                  </Td>
                  <Td>
                    {input.name} at {format_time(input.created_at)}
                  </Td>
                </Tr>
                <Tr>
                  <Td>Rows</Td>
                  <Td>{base.row_count}</Td>
                  <Td>{input.row_count}</Td>
                </Tr>
                <Tr>
                  <Td>Columns</Td>
                  <Td>{base.col_count}</Td>
                  <Td>{input.col_count}</Td>
                </Tr>
                <Tr>
                  <Td>Test status</Td>
                  <Td>2 Passed, 20 Failed</Td>
                  <Td>20 Passed, 2 Failed</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>

          <Heading fontSize={24}>Tests</Heading>
          <CompareTest base={base} input={input} />

          <Heading fontSize={24}>Schema</Heading>
          <CompareSchema base={base} input={input} />

          <Heading fontSize={24}>Profiling</Heading>
          <CompareProfile base={base} input={input} />
        </Flex>
      </Flex>
    </Main>
  );
}

export function ComparisonReport() {
  const data = window.PIPERIDER_REPORT_DATA;

  if (data === "") {
    return (
      <Main>
        <Flex justifyContent="center" alignItems="center" minHeight={"100vh"}>
          No profile data found.
        </Flex>
      </Main>
    );
  }

  return <ComparisonReportMain base={data.base} input={data.input} />;
}

function ComparisonBarChart({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (data.length > 0) {
      drawComparsionChart({
        containerWidth: containerRef.current.getBoundingClientRect().width,
        svgTarget: svgRef.current,
        tooltipTarget: ".chart",
        data,
      });
    }
  }, [data]);

  return (
    <Flex className={"chart"} ref={containerRef} width={"100%"}>
      <svg ref={svgRef} />
    </Flex>
  );
}
