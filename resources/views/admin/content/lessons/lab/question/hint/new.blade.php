@include('include.header')

	 <section class="section">
	 
	 	 		 <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('admin-view-lessons')}}">Lesson management</a></li>
            <li><a href="{{route('admin-list-lab-lesson-questions',['id'=>$question->lab_lesson->lesson->id])}}" >{{$question->lab_lesson->lesson->name}}</a></li>
		 <li><a href="{{route('admin-edit-lab-lesson-questions',['id'=>$question->lab_lesson->lesson->id,'question_id'=>$question->id])}}" >Question: {{$question->order}}</a></li>
			<li class="is-active"><a href="#" >New hint</a></li>
         </ul>
      </nav>
	  <hr/>
</div>
	 
	 
		 <div class="container">
		 <p>
		 {{$question->question}}
		 </p>
			<form method="POST" action="{{route('admin-create-lab-lesson-question-hints',['question_id' => $question->id])}}">
			@csrf
				<div class="field">
				  <label class="label">Hint</label>
				  <div class="control">
					<textarea class="textarea" placeholder="Textarea" name="hint"></textarea>
				  </div>
				</div> 

				<div class="field">
				  <label class="label">Price</label>
				  <div class="control">
						<input class="input" type="text" placeholder="100" name="price" value="100">
				  </div>
				</div>
				<div class="field">
				  <div class="control">
					<button class="button is-success">Save</button>
				  </div>
				</div>
			</form>
		</div>
    </section>


@include('include.footer')