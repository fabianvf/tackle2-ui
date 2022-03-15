import * as React from "react";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Wizard } from "@patternfly/react-core";

import { Application, Task, TaskData } from "@app/api/models";
import { SetMode } from "./set-mode";
import { SetTargets } from "./set-targets";
import { SetScope } from "./set-scope";
import { Options } from "./options";
import { Review } from "./review";
import { createTask } from "@app/api/rest";
import { alertActions } from "@app/store/alert";
import { getAxiosErrorMessage } from "@app/utils/utils";
import { CustomRules } from "./custom-rules";
import { IReadFile } from "./components/add-custom-rules";

import "./analysis-wizard.css";

interface IAnalysisWizard {
  applications: Application[];
  onClose: () => void;
}

export interface IFormValues {
  mode: string;
  targets: string[];
  withKnown: string;
  includedPackages: string[];
  excludedPackages: string[];
  customRulesFiles: IReadFile[];
  test: {
    a: string;
  };
}

const defaultTaskData: TaskData = {
  application: 0,
  path: "",
  mode: {
    binary: false,
    withDeps: false,
  },
  targets: [],
  scope: {
    withKnown: false,
    packages: {
      included: [],
      excluded: [],
    },
  },
};

const defaultTargets = [
  "camel",
  "cloud-readiness",
  "drools",
  "eap",
  "eap6",
  "eap7",
  "eapxp",
  "fsw",
  "fuse",
  "hibernate",
  "hibernate-search",
  "jakarta-ee",
  "java-ee",
  "jbpm",
  "linux",
  "openjdk",
  "quarkus",
  "quarkus1",
  "resteasy",
  "rhr",
];

export const AnalysisWizard: React.FunctionComponent<IAnalysisWizard> = ({
  applications,
  onClose,
}: IAnalysisWizard) => {
  const title = "Application analysis";
  const dispatch = useDispatch();

  const schema = yup
    .object({
      mode: yup.string().required(),
      target: yup.array().min(1, "Select one or more target"),
    })
    .required();

  const { register, setValue, getValues, handleSubmit, watch, formState } =
    useForm<IFormValues>({
      resolver: yupResolver(schema),
      defaultValues: {
        mode: "Binary",
        targets: [],
        withKnown: "",
        includedPackages: [""],
        excludedPackages: [""],
        customRulesFiles: [],
      },
    });

  const setTask = (application: Application, data: IFormValues): Task => {
    return {
      name: `${application.name}-windup-test`,
      addon: "windup",
      data: {
        ...defaultTaskData,
        application: application.id || 0,
        path: "",
        mode: {
          binary: data.mode.includes("Binary"),
          withDeps: data.mode.includes("dependencies"),
        },
        targets: data.targets,
        scope: {
          withKnown: data.withKnown.includes("depsAll") ? true : false,
          packages: {
            included: data.includedPackages,
            excluded: data.excludedPackages,
          },
        },
      },
    };
  };

  const onSubmit = (data: IFormValues) => {
    if (data.targets.length < 1) {
      console.log("Invalid form");
      return;
    }
    const tasks = applications.map((app) => setTask(app, data));
    const promises = Promise.all(tasks.map((task) => createTask(task)));
    promises
      .then((response) => {
        dispatch(
          alertActions.addSuccess(
            `Task(s) ${response
              .map((res) => res.data.name)
              .join(", ")} were added`
          )
        );
        onClose();
      })
      .catch((error) => {
        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
      });
  };

  const {
    mode,
    targets,
    customRulesFiles,
    withKnown,
    includedPackages,
    excludedPackages,
  } = getValues();

  const steps = [
    {
      name: "Configure analysis",
      steps: [
        {
          name: "Analysis mode",
          component: (
            <SetMode
              register={register}
              mode={mode}
              setMode={(val) => setValue("mode", val)}
            />
          ),
        },
        {
          name: "Set targets",
          component: (
            <SetTargets
              targets={targets}
              setTargets={(val) => setValue("targets", val)}
            />
          ),
        },
        {
          name: "Scope",
          component: (
            <SetScope
              withKnown={withKnown}
              includedPackages={includedPackages}
              excludedPackages={excludedPackages}
              setWithKnown={(val) => setValue("withKnown", val)}
              setIncludedPackages={(val) => setValue("includedPackages", val)}
              setExcludedPackages={(val) => setValue("excludedPackages", val)}
            />
          ),
        },
      ],
    },
    {
      name: "Advanced",
      steps: [
        {
          name: "Custom rules",
          component: (
            <CustomRules
              customRulesFiles={customRulesFiles}
              setValue={(val) => setValue("customRulesFiles", val)}
            />
          ),
        },
        { name: "Options", component: <Options targets={targets} /> },
      ],
    },
    {
      name: "Review",
      component: <Review applications={applications} getValues={getValues} />,
      nextButtonText: "Run",
    },
  ];

  console.log(watch());

  return (
    <Wizard
      isOpen={true}
      title="Application analysis"
      description={applications.map((app) => app.name).join(", ")}
      navAriaLabel={`${title} steps`}
      mainAriaLabel={`${title} content`}
      steps={steps}
      onSave={handleSubmit(onSubmit)}
      onClose={onClose}
    />
  );
};