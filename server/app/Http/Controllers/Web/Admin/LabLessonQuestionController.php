<?php

namespace App\Http\Controllers\Web\Admin;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\LabLessonQuestionAnswer;

use App\Models\UserLesson;
use App\Models\UserLabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LabLessonQuestionController extends Controller
{
	
	
	public function list($id)
    {

		return view('admin.content.lessons.lab.question.list',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail()]);

	
    }
	
	public function new($id)
    {
		return view('admin.content.lessons.lab.question.new',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail()]);

	
    }

	public function create(Request $request,$id)
	{
		
		$validated = $request->validate([
			'content' => 'required',
			'type' => 'required',
			'score' => 'required',
		]);
		$labLesson=LabLesson::where('lesson_id', $id)->firstOrFail();
		
		$question=new LabLessonQuestion; 
	
		$question->question=$request->input('content');
		$question->score=intval($request->input('score'));
		$question->type=$request->input('type');
		$labLesson->questions()->save($question);

		if($request->input('type')=="string")
		{
			$answer=new LabLessonQuestionAnswer;
			$answer->lab_lesson_question_id=$question->id;
			$answer->answer=$request->input('answer');
			$answer->save();
		}
		else if($request->input('type')=="repeat" || $question->type=="vuln")
		{
			foreach($request->input('answers') as $userAnswer)
			{
				$answer=new LabLessonQuestionAnswer;
				$answer->lab_lesson_question_id=$question->id;
				$answer->answer=$userAnswer;
				$answer->save();
			}
		}


		return redirect()->route('admin-list-lab-lesson-questions',['id' =>$id]);
	}
	
	
	
	

	public function edit($id,$question_id)
    {
		return view('admin.content.lessons.lab.question.edit',['lesson' =>LabLesson::where('lesson_id', $id)->firstOrFail(),'question' =>LabLessonQuestion::findOrFail($question_id)]);
    }

	public function decrease($id,$question_id)
	{
		LabLesson::where('lesson_id', $id)->firstOrFail();
		$question=LabLessonQuestion::findOrFail($question_id);
		if($question->order>0)
		$question->order=$question->order-1;
		
		$question->save();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}

	
	public function increase($id,$question_id)
	{
		LabLesson::where('lesson_id', $id)->firstOrFail();
		$question=LabLessonQuestion::findOrFail($question_id);
		$question->order=$question->order+1;
		
		$question->save();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}

	
	
	public function delete(Request $request,$id,$question_id)
	{	

		 LabLessonQuestion::where('id', $question_id)->delete();
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);
	}


	public function update(Request $request,$id,$question_id)
	{
		$question=LabLessonQuestion::findOrFail($question_id);
		$validated = $request->validate([
			'content' => 'required',
			'score' => 'required',
		]);

		$question->question=$request->input('content');
		$question->score=intval($request->input('score'));
		$question->save();
	
	
		if($question->type=="string")
		{
			$answer=LabLessonQuestionAnswer::where('lab_lesson_question_id',$question->id)->first();
			$answer->answer=$request->input('answer');
			$answer->save();
		}
		else if($question->type=="repeat" || $question->type=="vuln")
		{
			LabLessonQuestionAnswer::where('lab_lesson_question_id',$question->id)->delete();
			foreach($request->input('answers') as $userAnswer)
			{
				$answer=new LabLessonQuestionAnswer;
				$answer->lab_lesson_question_id=$question->id;
				$answer->answer=$userAnswer;
				$answer->save();
			}
		}

	
	
		return redirect()->route('admin-list-lab-lesson-questions', ['id' =>$id]);

	}
	

}
	
	
	
	
	
	

