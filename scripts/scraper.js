// user clicks button
// expect loadingStyle
// when gone, look for fail or success
//   fail: some error exists
//   success: some time space text will show up

// predicted leetcode logic flow
// user submit
// compile and run
// if fail: show error and save contents to local storage
// if pass: go to submission tab and display runtime/memory - does not save to localStorage

const Utils = {
  get: (object, path) => {
    const chainedKeys = path.split(".");
    let result = object;
    for (const key of chainedKeys) {
      if (!result[key]) {
        Utils.info(`invalid key ${key}`);
        return null;
      }
      result = result[key];
    }

    return result;
  },
  warn: (...params) => {
    console.warn("Katsudon: ", ...params);
  },
  info: (...params) => {
    console.log("Katsudon: ", ...params);
  },
};

Utils.info("Loaded");

const classes = {
  sumbitButton:
    "px-3 py-1.5 font-medium items-center whitespace-nowrap transition-all focus:outline-none inline-flex text-label-r bg-green-s dark:bg-dark-green-s hover:bg-green-3 dark:hover:bg-dark-green-3 rounded-lg",
  loadingRect: "animate-pulse flex w-full flex-col space-y-4",
  errorResult: "text-xl font-medium text-red-s dark:text-dark-red-s",
  languageLabel: "text-xs text-label-2 dark:text-dark-label-2",
  solutionStats: "text-label-1 dark:text-dark-label-1 ml-2 font-medium",
  submittedLanguages:
    "inline-flex items-center whitespace-nowrap text-xs rounded-full bg-blue-0 dark:bg-dark-blue-0 text-blue-s dark:text-dark-blue-s px-3 py-1 font-medium leading-4",
};

const constants = {
  intervalTick: 400, //ms
  scriptData: () => {
    return Utils.get(
      JSON.parse(document.getElementById("__NEXT_DATA__").innerText),
      "props.pageProps.dehydratedState.queries"
    );
  },
  problemInfo: () => {
    const problemInfoIdx = 0;

    const problem = Utils.get(
      constants.scriptData()[problemInfoIdx],
      "state.data.question"
    );
    return {
      id: problem.questionFrontendId,
      title: problem.title,
      title_slug: problem.titleSlug,
      difficulty: problem.difficulty,
      premium: problem.isPaidOnly,
    };
  },
  starterCode: (language) => {
    const startingCodeIdx = 2;
    const starterCodes = Utils.get(
      constants.scriptData()[startingCodeIdx],
      "state.data.question.codeSnippets"
    );

    const solution = Utils.get(
      starterCodes.find((code) => code.langSlug === language),
      "code"
    );

    return solution;
  },
};

function validateSubmit(targetElement) {
  return targetElement.innerText === "Submit";
}

/**
 * @description Waits for leetcode to process the solution and calls the scraper after
 * @param {void} next The next function to call
 * @returns nothing
 */
let awaitSubmissionInterval = null; // global submission status
async function awaitSubmission() {
  if (!!awaitSubmissionInterval) {
    Utils.warn("Katsudon: already submitting");
    return;
  }
  const isLoading = () =>
    !!document.getElementsByClassName(classes.loadingRect).length;

  if (!awaitSubmissionInterval) {
    // wait for leetcode to process the solution (loading rectangles)
    awaitSubmissionInterval = setInterval(() => {
      if (!isLoading()) {
        clearInterval(awaitSubmissionInterval);
        awaitSubmissionInterval = null;
        checkFailed();
      }
    }, constants.intervalTick);
  }
}

/**
 * @description waits for the successful submission to resolve
 * @param {void} createSolution callback to solution creater
 * @returns {void} next function to call
 */
let awaitSolutionInterval;
async function awaitPassedSolution() {
  Utils.info("waiting for it to render");
  const codeBlockExists = () => !!document.querySelector("pre");

  if (!awaitSolutionInterval) {
    awaitSolutionInterval = setInterval(() => {
      if (codeBlockExists()) {
        clearInterval(awaitSolutionInterval);
        awaitSolutionInterval = null;
        handleSubmit(createPassedSolution());
      }
    }, constants.intervalTick);
  }
}

/**
 * @description retrieves the submission result
 * @returns an object representing the result containing errors/runtime/memory
 */
async function checkFailed() {
  // Check for TLE, MLE, Compile Error, Runtime Error, and Wrong Answer
  const [errorTag] = document.getElementsByClassName(classes.errorResult);
  const failed = !!errorTag;
  const failedObject = {
    failed: failed,
    error: failed ? errorTag.innerText : null,
  };

  return await scrapeSubmission(failedObject);
}

/**
 * @description retrieve solution from localStorage
 * If it does not exist, then it should be in the scriptData as the starting code
 * @returns the solution from submission
 */
async function createFailedSolution() {
  const problemId = Utils.get(constants.problemInfo(), "id");
  const solutionLanguage = document
    .querySelector("[data-mode-id]")
    .getAttribute("data-mode-id");
  const localStorageKeys = Object.keys(localStorage);
  const solutionRegex = new RegExp(`^${problemId}.+${solutionLanguage}$`);

  // https://stackoverflow.com/a/43825436
  const solutionKey = localStorageKeys.find((key) => solutionRegex.test(key));

  // send starter code if solution not saved
  const solution = !!localStorage.getItem(solutionKey)
    ? localStorage.getItem(solutionKey).slice(1, -1)
    : constants.starterCode(solutionLanguage);

  Utils.info(solution);
  const [solutionLanguageLabel] = document.getElementsByClassName(
    classes.submittedLanguages
  );

  const solutionObject = {
    problem_id: problemId,
    solution_language: solutionLanguageLabel,
    solution: solution,
    failed: true,
    runtime_ms: null,
    memory_usage_mb: null,
  };
  return await handleSubmit(solutionObject);
}

function createPassedSolution() {
  const solution = document.querySelector("pre").innerText;
  const tags = Array.from(
    document.getElementsByClassName(classes.solutionStats)
  );
  const [runtime, memory] = tags.map((tag) => tag.innerText.split(" ")[0]);

  const firstSolutionLanguage = document.getElementsByClassName(
    classes.submittedLanguages
  )[0].innerText;

  const solutionObject = {
    solution_language: firstSolutionLanguage,
    solution: solution,
    failed: false,
    runtime_ms: runtime,
    memory_usage_mb: memory,
  };
  return solutionObject;
}

async function scrapeSubmission(failedObject) {
  // if submission failed, it will be saved to localStorage
  // retrieve code submission from localStorage
  const { failed } = failedObject;

  const scrapeSolution = failed ? createFailedSolution : awaitPassedSolution;

  await scrapeSolution();
}

async function handleSubmit(solution) {
  console.log("retreived ", solution);
}

async function submissionLifeCycle(e) {
  if (!validateSubmit(e.target)) {
    Utils.info("not submit button");
    return;
  }
  await awaitSubmission();
}

document.addEventListener("click", async (e) => await submissionLifeCycle(e));
