@include('include.header')

	 <section class="section">
	 
	 <div class="container">
      <nav class="breadcrumb" aria-label="breadcrumbs">
         <ul>
            <li><a href="{{route('admin-view-lessons')}}">Lesson management</a></li>
            <li class="is-active"><a href="#" >{{$lesson->name}}</a></li>
         </ul>
      </nav>
	  <hr/>
</div>
	 
	 
	 
		 <div class="container">

			<form method="POST" action="{{route('admin-update-lab-lesson',['id' => $lesson->id])}}">
			@method('PUT')
			@csrf

	
	<div class="field">
  <label class="label">Lesson name</label>
  <div class="control">
		<input class="input" type="text" placeholder="Lesson name" name="name" value="{{$lesson->name}}">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description">{{$lesson->description}}</textarea>
	
  </div>
</div> 

<hr/>
	
	
	


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="content" name="content">{{$lesson->lab->content}}</textarea>
	
  </div>
</div>









<div class="field">
	<label class="label">Virtual machine</label>
  <div class="control">

<div class="select">
  <select name="vm">
  @foreach ($vms as $vm)
  @if($vm->id==$lesson->lab->vm_id)
    <option value="{{$vm->id}}" selected>{{$vm->name}}</option>
	@else
	 <option value="{{$vm->id}}">{{$vm->name}}</option>
	@endif
	@endforeach
  </select>
</div>
  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
	
	@if (isset($lesson->published))
		@if ($lesson->published)
			<input type="checkbox" name="published" checked>
		@else
			<input type="checkbox" name="published">
		@endif
	@else
		<input type="checkbox" name="published">
	@endif
     Published
    </label>
  </div>
</div>



<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')
