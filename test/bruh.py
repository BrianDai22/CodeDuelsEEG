import streamlit as st
from streamlit_monaco import st_monaco

# -----------------------------------------------------------
# Helper function to run and test submitted code.
# It uses exec() to compile the code and then runs the specified
# function with the provided test cases.
# -----------------------------------------------------------
def run_code(code_str, func_name, test_cases):
    results = {"all_passed": True, "failures": []}
    local_env = {}
    try:
        exec(code_str, {}, local_env)
    except Exception as e:
        results["all_passed"] = False
        results["failures"].append(f"Code did not compile: {e}")
        return results

    if func_name not in local_env:
        results["all_passed"] = False
        results["failures"].append(f"Function '{func_name}' is not defined.")
        return results

    func = local_env[func_name]
    for idx, tc in enumerate(test_cases):
        try:
            # Each test case input is a dictionary with function parameters.
            result = func(**tc["input"])
            if result != tc["output"]:
                results["all_passed"] = False
                results["failures"].append(
                    f"Test case {idx+1} failed: Input: {tc['input']}, "
                    f"Expected: {tc['output']}, Got: {result}"
                )
        except Exception as e:
            results["all_passed"] = False
            results["failures"].append(
                f"Test case {idx+1} raised an exception: {e}"
            )
    return results

# -----------------------------------------------------------
# Define the three problems with their function names and test cases.
# -----------------------------------------------------------
TEST_CASES = {
    "Two Sum": {
        "function": "twoSum",
        "description": (
            "Given an integer array nums and an integer target, return indices of the two numbers such that they add up to target."
        ),
        "cases": [
            {"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]},
            {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]}
        ]
    },
    "Maximum Subarray": {
        "function": "maxSubArray",
        "description": (
            "Given an integer array nums, find the contiguous subarray (containing at least one number) "
            "which has the largest sum and return its sum."
        ),
        "cases": [
            {"input": {"nums": [-2,1,-3,4,-1,2,1,-5,4]}, "output": 6},
            {"input": {"nums": [1]}, "output": 1}
        ]
    },
    "Valid Palindrome": {
        "function": "isPalindrome",
        "description": (
            "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all "
            "non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true "
            "if it is a palindrome, or false otherwise."
        ),
        "cases": [
            {"input": {"s": "A man, a plan, a canal: Panama"}, "output": True},
            {"input": {"s": "race a car"}, "output": False}
        ]
    }
}

# -----------------------------------------------------------
# Session state for tracking scores and solved problems.
# -----------------------------------------------------------
if "p1_score" not in st.session_state:
    st.session_state.p1_score = 0
if "p2_score" not in st.session_state:
    st.session_state.p2_score = 0
if "p1_solved" not in st.session_state:
    st.session_state.p1_solved = set()
if "p2_solved" not in st.session_state:
    st.session_state.p2_solved = set()

# -----------------------------------------------------------
# UI Layout
# -----------------------------------------------------------
st.title("Coding 1v1: LeetCode Challenge")

# Sidebar for problem selection and scoreboard
st.sidebar.header("Select Problem")
problem_options = list(TEST_CASES.keys())
selected_problem = st.sidebar.selectbox("Problem", problem_options)
problem_details = TEST_CASES[selected_problem]
function_name = problem_details["function"]

st.sidebar.header("Scoreboard")
st.sidebar.write(f"**Player 1:** {st.session_state.p1_score} solved")
st.sidebar.write(f"**Player 2:** {st.session_state.p2_score} solved")

# Display problem description and test cases
st.subheader(f"Problem: {selected_problem}")
st.markdown(problem_details["description"])
st.markdown("**Test Cases:**")
for idx, tc in enumerate(problem_details["cases"]):
    st.markdown(f"- **Test case {idx+1}:** Input: `{tc['input']}` | Expected Output: `{tc['output']}`")

st.markdown("---")

# Two columns for two players
col1, col2 = st.columns(2)

# Default code templates
default_templates = {
    "Two Sum": (
        "def twoSum(nums, target):\n"
        "    # Write your code here\n"
        "    pass\n"
    ),
    "Maximum Subarray": (
        "def maxSubArray(nums):\n"
        "    # Write your code here\n"
        "    pass\n"
    ),
    "Valid Palindrome": (
        "def isPalindrome(s):\n"
        "    # Write your code here\n"
        "    pass\n"
    )
}

# -----------------------------------------------------------
# Player 1 editor and evaluation
# -----------------------------------------------------------
with col1:
    st.header("Player 1")
    code_p1 = st_monaco(
        height=300,
        language="python",
        value=default_templates[selected_problem]
    )
    if st.button("Run Player 1 Code", key="run_p1"):
        st.info("Running Player 1's code...")
        results_p1 = run_code(code_p1, function_name, problem_details["cases"])
        if results_p1["all_passed"]:
            st.success("Player 1: All test cases passed!")
            if selected_problem not in st.session_state.p1_solved:
                st.session_state.p1_score += 1
                st.session_state.p1_solved.add(selected_problem)
        else:
            for failure in results_p1["failures"]:
                st.error("Player 1: " + failure)

# -----------------------------------------------------------
# Player 2 editor and evaluation
# -----------------------------------------------------------
with col2:
    st.header("Player 2")
    code_p2 = st_monaco(
        height=300,
        language="python",
        value=default_templates[selected_problem]
    )
    if st.button("Run Player 2 Code", key="run_p2"):
        st.info("Running Player 2's code...")
        results_p2 = run_code(code_p2, function_name, problem_details["cases"])
        if results_p2["all_passed"]:
            st.success("Player 2: All test cases passed!")
            if selected_problem not in st.session_state.p2_solved:
                st.session_state.p2_score += 1
                st.session_state.p2_solved.add(selected_problem)
        else:
            for failure in results_p2["failures"]:
                st.error("Player 2: " + failure)

# -----------------------------------------------------------
# Winner Declaration: First to solve 3 distinct problems wins
# -----------------------------------------------------------
if st.session_state.p1_score >= 3 or st.session_state.p2_score >= 3:
    if st.session_state.p1_score > st.session_state.p2_score:
        st.balloons()
        st.success("Player 1 wins!")
    elif st.session_state.p2_score > st.session_state.p1_score:
        st.balloons()
        st.success("Player 2 wins!")
    else:
        st.warning("It's a tie!")