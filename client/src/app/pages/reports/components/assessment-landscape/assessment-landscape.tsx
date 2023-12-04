import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Flex, FlexItem, Skeleton } from "@patternfly/react-core";

import { RISK_LIST } from "@app/Constants";
import { Assessment, IdRef, Questionnaire } from "@app/api/models";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { Donut } from "../donut/donut";
import { useFetchAssessmentsWithArchetypeApplications } from "@app/queries/assessments";

interface IAggregateRiskData {
  green: number;
  yellow: number;
  red: number;
  unknown: number;
  unassessed: number;
  assessmentCount: number;
}

const aggregateRiskData = (assessments: Assessment[]): IAggregateRiskData => {
  let low = 0;
  let medium = 0;
  let high = 0;
  let unknown = 0;

  assessments?.forEach((assessment) => {
    switch (assessment.risk) {
      case "green":
        low++;
        break;
      case "yellow":
        medium++;
        break;
      case "red":
        high++;
        break;
      case "unknown":
        unknown++;
        break;
    }
  });

  return {
    green: low,
    yellow: medium,
    red: high,
    unknown,
    unassessed: assessments.length - low - medium - high,
    assessmentCount: assessments.length,
  };
};

interface IAssessmentLandscapeProps {
  /**
   * The selected questionnaire or `null` if _all questionnaires_ is selected.
   */
  questionnaire: Questionnaire | null;

  /**
   * The set of assessments for the selected questionnaire.  Risk values will be
   * aggregated from the individual assessment risks.
   */
  assessmentRefs?: IdRef[];
}

export const AssessmentLandscape: React.FC<IAssessmentLandscapeProps> = ({
  questionnaire,
  assessmentRefs,
}) => {
  const { t } = useTranslation();

  const { assessmentsWithArchetypeApplications } =
    useFetchAssessmentsWithArchetypeApplications();

  const filteredAssessments = assessmentsWithArchetypeApplications.filter(
    (assessment) => assessmentRefs?.some((ref) => ref.id === assessment.id)
  );

  const landscapeData = useMemo(
    () => aggregateRiskData(filteredAssessments),
    [filteredAssessments]
  );

  return (
    <ConditionalRender
      when={!questionnaire && !filteredAssessments}
      then={
        <div style={{ height: 200, width: 400 }}>
          <Skeleton height="75%" width="100%" />
        </div>
      }
    >
      {landscapeData && (
        <Flex
          justifyContent={{ default: "justifyContentSpaceAround" }}
          spaceItems={{ default: "spaceItemsNone" }}
          gap={{ default: "gapMd" }}
        >
          <FlexItem>
            <Donut
              isAssessment={true}
              id="landscape-donut-red"
              value={landscapeData.red}
              total={landscapeData.assessmentCount}
              color={RISK_LIST.red.hexColor}
              riskLabel={t("terms.highRisk")}
              riskDescription={questionnaire?.riskMessages?.red ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={true}
              id="landscape-donut-yellow"
              value={landscapeData.yellow}
              total={landscapeData.assessmentCount}
              color={RISK_LIST.yellow.hexColor}
              riskLabel={t("terms.mediumRisk")}
              riskDescription={questionnaire?.riskMessages?.yellow ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={true}
              id="landscape-donut-green"
              value={landscapeData.green}
              total={landscapeData.assessmentCount}
              color={RISK_LIST.green.hexColor}
              riskLabel={t("terms.lowRisk")}
              riskDescription={questionnaire?.riskMessages?.green ?? ""}
            />
          </FlexItem>
          <FlexItem>
            <Donut
              isAssessment={true}
              id="landscape-donut-unassessed"
              value={landscapeData.unassessed}
              total={landscapeData.assessmentCount}
              color={RISK_LIST.unknown.hexColor}
              riskLabel={`${t("terms.unassessed")}/${t("terms.unknown")}`}
              riskDescription={questionnaire?.riskMessages?.unknown ?? ""}
            />
          </FlexItem>
        </Flex>
      )}
    </ConditionalRender>
  );
};